import os
import sys
import csv
import json
import time
from pathlib import Path
from collections import defaultdict
import numpy as np
from PIL import Image
import joblib
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    classification_report,
    confusion_matrix
)

# 7 Target Classes strictly matching system specifications
DOCUMENT_CLASSES = [
    "st_certificate",
    "academic_document",
    "income_certificate",
    "admission_registration",
    "research_proposal",
    "foreign_offer_letter",
    "study_research_plan"
]
CLASS_TO_IDX = {cls_name: i for i, cls_name in enumerate(DOCUMENT_CLASSES)}
IDX_TO_CLASS = {i: cls_name for i, cls_name in enumerate(DOCUMENT_CLASSES)}

def find_dataset_dir() -> Path:
    candidates = [
        Path(__file__).resolve().parent.parent.parent / "SIH_ST_NFST_NOS_1000",
        Path("/Users/divyank/Desktop/sih final prtotype/SIH_ST_NFST_NOS_1000"),
        Path("../SIH_ST_NFST_NOS_1000"),
    ]
    for c in candidates:
        if c.exists() and (c / "data" / "document_manifest.csv").exists():
            return c
    raise FileNotFoundError("SIH_ST_NFST_NOS_1000 dataset directory not found.")

def extract_image_features(image_path: Path) -> np.ndarray:
    """
    Extracts structural layout & header projection features from document image.
    Uses multi-region spatial sampling to capture document layout and header typography.
    """
    with Image.open(image_path) as img:
        gray = img.convert("L")
        
        # 1. Header Crop (top 35% of page where title and primary fields reside)
        w, h = gray.size
        header_crop = gray.crop((0, 0, w, int(h * 0.35)))
        header_resized = header_crop.resize((64, 32))
        header_feats = np.asarray(header_resized, dtype=np.float32).flatten() / 255.0

        # 2. Full Page Downscaled Layout Thumbnail (64x64)
        full_resized = gray.resize((64, 64))
        full_feats = np.asarray(full_resized, dtype=np.float32).flatten() / 255.0

        # 3. Spatial Projection Histograms (Horizontal & Vertical density of text)
        arr = np.asarray(gray, dtype=np.float32) / 255.0
        text_mask = (arr < 0.85).astype(np.float32)
        h_proj = np.mean(text_mask, axis=1) # shape (h,)
        v_proj = np.mean(text_mask, axis=0) # shape (w,)

        # Sample projections to fixed dimension
        h_proj_sampled = np.interp(np.linspace(0, len(h_proj), 64), np.arange(len(h_proj)), h_proj)
        v_proj_sampled = np.interp(np.linspace(0, len(v_proj), 64), np.arange(len(v_proj)), v_proj)

        # Concatenate features
        feature_vec = np.concatenate([
            header_feats,       # 64 * 32 = 2048
            full_feats,         # 64 * 64 = 4096
            h_proj_sampled,     # 64
            v_proj_sampled      # 64
        ])                      # Total dimension = 6272
        return feature_vec

def build_leakage_safe_application_split(dataset_dir: Path):
    """
    Builds a scheme-stratified applicant/application-level split:
    - 600 NFST applications stratified: 420 train (70%), 90 val (15%), 90 test (15%)
    - 400 NOS applications stratified:  280 train (70%), 60 val (15%), 60 test (15%)
    - Total: 700 train (70%), 150 val (15%), 150 test (15%)
    
    Guarantees:
    1. Zero Applicant Leakage: Every application's documents belong exclusively to one split.
    2. Zero Class Starvation: Both NFST-specific documents (admission_registration, research_proposal)
       and NOS-specific documents (foreign_offer_letter, study_research_plan) have robust representation
       in all three splits (train, validation, and held-out test).
    3. Fully deterministic via seed=42.
    4. Leaves original dataset files 100% untouched.
    """
    apps_file = dataset_dir / "data" / "applications.csv"
    
    nfst_apps = []
    nos_apps = []
    
    with open(apps_file, mode="r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            app_id = row["application_id"]
            scheme = row["scheme"].strip().upper()
            if scheme == "NFST":
                nfst_apps.append(app_id)
            elif scheme == "NOS":
                nos_apps.append(app_id)

    nfst_apps.sort()
    nos_apps.sort()

    rng = np.random.RandomState(42)
    nfst_perm = list(rng.permutation(nfst_apps))
    nos_perm = list(rng.permutation(nos_apps))

    def partition(items, train_frac=0.70, val_frac=0.15):
        n = len(items)
        n_train = int(n * train_frac)
        n_val = int(n * val_frac)
        train_set = set(items[:n_train])
        val_set = set(items[n_train:n_train + n_val])
        test_set = set(items[n_train + n_val:])
        return train_set, val_set, test_set

    nfst_tr, nfst_va, nfst_te = partition(nfst_perm, 0.70, 0.15)
    nos_tr, nos_va, nos_te = partition(nos_perm, 0.70, 0.15)

    app_split_map = {}
    for a in (nfst_tr | nos_tr):
        app_split_map[a] = "train"
    for a in (nfst_va | nos_va):
        app_split_map[a] = "val"
    for a in (nfst_te | nos_te):
        app_split_map[a] = "test"

    return app_split_map, {
        "nfst": {"train": len(nfst_tr), "val": len(nfst_va), "test": len(nfst_te), "total": len(nfst_apps)},
        "nos": {"train": len(nos_tr), "val": len(nos_va), "test": len(nos_te), "total": len(nos_apps)}
    }

def load_data_with_leakage_safe_split(dataset_dir: Path):
    """
    Loads document records grouped strictly by the leakage-safe scheme-stratified split.
    """
    app_split_map, app_stats = build_leakage_safe_application_split(dataset_dir)
    manifest_file = dataset_dir / "data" / "document_manifest.csv"
    labels_file = dataset_dir / "labels" / "document_type_labels.csv"

    doc_type_map = {}
    with open(labels_file, mode="r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            doc_type_map[row["document_id"]] = row["document_type"].strip()

    records = {"train": [], "val": [], "test": []}
    missing_files = 0

    with open(manifest_file, mode="r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            app_id = row["application_id"]
            doc_id = row["document_id"]
            rel_path = row["file_path"]
            is_present = row["present"].strip().lower() == "true"

            if not is_present or not rel_path:
                continue

            split_name = app_split_map.get(app_id)
            if not split_name:
                continue

            doc_type = doc_type_map.get(doc_id) or row["document_type"]
            if doc_type not in CLASS_TO_IDX:
                continue

            abs_path = dataset_dir / rel_path
            if abs_path.exists():
                records[split_name].append({
                    "doc_id": doc_id,
                    "app_id": app_id,
                    "path": abs_path,
                    "label": doc_type,
                    "label_idx": CLASS_TO_IDX[doc_type]
                })
            else:
                missing_files += 1

    return records, app_stats

def extract_features_with_store(record_list, split_name, store_path: Path):
    """
    Extracts features with persistent per-document store to accelerate iterations while guaranteeing exactness.
    """
    store = {}
    if store_path.exists():
        try:
            store = joblib.load(store_path)
        except Exception:
            store = {}

    print(f"Processing features for {split_name} split ({len(record_list)} samples)...")
    X = []
    y = []
    new_extracted = 0
    start_time = time.time()

    for idx, rec in enumerate(record_list):
        doc_id = rec["doc_id"]
        if doc_id in store:
            feat = store[doc_id]
        else:
            feat = extract_image_features(rec["path"])
            store[doc_id] = feat
            new_extracted += 1

        X.append(feat)
        y.append(rec["label_idx"])

        if (idx + 1) % 500 == 0 or (idx + 1) == len(record_list):
            print(f"  Processed {idx + 1}/{len(record_list)} samples [{time.time() - start_time:.1f}s]")

    # Persist updated store
    store_path.parent.mkdir(parents=True, exist_ok=True)
    joblib.dump(store, store_path)
    if new_extracted > 0:
        print(f"  Saved {new_extracted} new feature vectors to store: {store_path.name}")

    return np.array(X, dtype=np.float32), np.array(y, dtype=np.int64)

def compute_per_class_counts(record_list):
    counts = defaultdict(int)
    for rec in record_list:
        counts[rec["label"]] += 1
    return dict(counts)

def main():
    print("======================================================================")
    print("7-CLASS DOCUMENT CLASSIFICATION - LEAKAGE-SAFE STRATIFIED PIPELINE")
    print("Ministry of Tribal Affairs - Scheduled Tribes Scholarship Platform")
    print("======================================================================")

    dataset_dir = find_dataset_dir()
    print(f"Dataset root: {dataset_dir}")

    # 1. Build leakage-safe stratified split
    records_by_split, app_stats = load_data_with_leakage_safe_split(dataset_dir)

    print("\n--- Application-Level Stratification Summary ---")
    print(f"  NFST Applications: Train={app_stats['nfst']['train']}, Val={app_stats['nfst']['val']}, Test={app_stats['nfst']['test']} (Total={app_stats['nfst']['total']})")
    print(f"  NOS Applications:  Train={app_stats['nos']['train']}, Val={app_stats['nos']['val']}, Test={app_stats['nos']['test']} (Total={app_stats['nos']['total']})")
    print(f"  Total Applications: Train={app_stats['nfst']['train'] + app_stats['nos']['train']}, Val={app_stats['nfst']['val'] + app_stats['nos']['val']}, Test={app_stats['nfst']['test'] + app_stats['nos']['test']} (Total=1000)")

    print("\n--- Document Samples per Split ---")
    print(f"  Train samples: {len(records_by_split['train'])}")
    print(f"  Val samples:   {len(records_by_split['val'])}")
    print(f"  Test samples:  {len(records_by_split['test'])}")
    print(f"  Total samples: {sum(len(v) for v in records_by_split.values())}")

    # Display per-class distribution across splits
    train_counts = compute_per_class_counts(records_by_split["train"])
    val_counts = compute_per_class_counts(records_by_split["val"])
    test_counts = compute_per_class_counts(records_by_split["test"])

    print("\n--- Per-Class Sample Distribution Across Splits ---")
    print(f"{'Document Class':<25} {'Train':<10} {'Val':<10} {'Test':<10} {'Total':<10}")
    print("-" * 65)
    for cls_name in DOCUMENT_CLASSES:
        tr_c = train_counts.get(cls_name, 0)
        va_c = val_counts.get(cls_name, 0)
        te_c = test_counts.get(cls_name, 0)
        tot_c = tr_c + va_c + te_c
        print(f"{cls_name:<25} {tr_c:<10} {va_c:<10} {te_c:<10} {tot_c:<10}")

    # 2. Extract features with persistent store
    weights_dir = Path(__file__).resolve().parent / "app" / "models" / "weights"
    weights_dir.mkdir(parents=True, exist_ok=True)
    store_path = weights_dir / ".features_cache" / "document_features_store.joblib"

    print("\n--- Feature Extraction ---")
    X_train, y_train = extract_features_with_store(records_by_split["train"], "TRAIN", store_path)
    X_val, y_val = extract_features_with_store(records_by_split["val"], "VAL", store_path)
    X_test, y_test = extract_features_with_store(records_by_split["test"], "TEST", store_path)

    # 3. Model Training & Validation Tuning
    print("\n--- Hyperparameter Tuning on Validation Split ---")
    candidate_c = [0.1, 1.0, 5.0]
    best_model = None
    best_val_f1 = -1.0
    best_c = 1.0

    for c in candidate_c:
        clf = LogisticRegression(
            C=c,
            max_iter=1000,
            solver="lbfgs",
            random_state=42
        )
        clf.fit(X_train, y_train)
        val_preds = clf.predict(X_val)
        val_f1 = f1_score(y_val, val_preds, average="macro", zero_division=0)
        val_acc = accuracy_score(y_val, val_preds)
        print(f"  [C={c:>3}] Val Accuracy: {val_acc * 100:.2f}% | Val Macro F1: {val_f1 * 100:.2f}%")

        if val_f1 > best_val_f1:
            best_val_f1 = val_f1
            best_model = clf
            best_c = c

    print(f"\nBest Model Selected: Multinomial Logistic Regression with C={best_c} (Validation Macro F1 = {best_val_f1 * 100:.2f}%)")

    # 4. Final Single Evaluation on Corrected Held-Out Test Split
    print("\n======================================================================")
    print("FINAL SINGLE EVALUATION ON CORRECTED HELD-OUT TEST SPLIT")
    print("======================================================================")
    test_preds = best_model.predict(X_test)

    test_acc = accuracy_score(y_test, test_preds)
    test_prec_macro = precision_score(y_test, test_preds, average="macro", zero_division=0)
    test_rec_macro = recall_score(y_test, test_preds, average="macro", zero_division=0)
    test_f1_macro = f1_score(y_test, test_preds, average="macro", zero_division=0)
    test_f1_weighted = f1_score(y_test, test_preds, average="weighted", zero_division=0)

    print(f"Test Accuracy:         {test_acc * 100:.2f}%")
    print(f"Test Macro Precision:  {test_prec_macro * 100:.2f}%")
    print(f"Test Macro Recall:     {test_rec_macro * 100:.2f}%")
    print(f"Test Macro F1-Score:   {test_f1_macro * 100:.2f}%")
    print(f"Test Weighted F1-Score:{test_f1_weighted * 100:.2f}%")

    labels_all = list(range(len(DOCUMENT_CLASSES)))
    print("\nPer-Class Classification Report:")
    report_dict = classification_report(
        y_test,
        test_preds,
        labels=labels_all,
        target_names=DOCUMENT_CLASSES,
        digits=4,
        output_dict=True,
        zero_division=0
    )
    print(classification_report(y_test, test_preds, labels=labels_all, target_names=DOCUMENT_CLASSES, digits=4, zero_division=0))

    cm = confusion_matrix(y_test, test_preds, labels=labels_all)
    print("Confusion Matrix (Rows=True, Columns=Predicted):")
    print("Classes Order:", DOCUMENT_CLASSES)
    print(cm)

    # 5. Save Verified Model Weights Artifact
    model_path = weights_dir / "document_classifier.joblib"
    meta_path = weights_dir / "document_classifier_metrics.json"

    model_artifact = {
        "model": best_model,
        "classes": DOCUMENT_CLASSES,
        "class_to_idx": CLASS_TO_IDX,
        "idx_to_class": IDX_TO_CLASS,
        "feature_dim": X_train.shape[1],
        "trained_date": time.strftime("%Y-%m-%d %H:%M:%S"),
        "best_hyperparams": {"C": best_c, "solver": "lbfgs"},
        "split_method": "Scheme-Stratified Applicant-Level Group Split (Leakage-Safe)"
    }
    joblib.dump(model_artifact, model_path)
    print(f"\nCorrected model artifact saved to: {model_path}")

    # Save detailed metrics JSON
    metrics_summary = {
        "model_architecture": "Multinomial Logistic Regression (L2 Regularized)",
        "split_methodology": "Leakage-Safe Scheme-Stratified Group Split at Applicant Level (70% Train, 15% Val, 15% Test)",
        "application_counts": {
            "train": app_stats["nfst"]["train"] + app_stats["nos"]["train"],
            "val": app_stats["nfst"]["val"] + app_stats["nos"]["val"],
            "test": app_stats["nfst"]["test"] + app_stats["nos"]["test"],
            "total": 1000
        },
        "sample_counts": {
            "train_samples": int(len(X_train)),
            "val_samples": int(len(X_val)),
            "test_samples": int(len(X_test)),
            "total_samples": int(len(X_train) + len(X_val) + len(X_test))
        },
        "per_class_sample_distribution": {
            cls_name: {
                "train": train_counts.get(cls_name, 0),
                "val": val_counts.get(cls_name, 0),
                "test": test_counts.get(cls_name, 0),
                "total": train_counts.get(cls_name, 0) + val_counts.get(cls_name, 0) + test_counts.get(cls_name, 0)
            }
            for cls_name in DOCUMENT_CLASSES
        },
        "test_accuracy": round(float(test_acc), 4),
        "test_precision_macro": round(float(test_prec_macro), 4),
        "test_recall_macro": round(float(test_rec_macro), 4),
        "test_f1_macro": round(float(test_f1_macro), 4),
        "test_f1_weighted": round(float(test_f1_weighted), 4),
        "per_class_report": report_dict,
        "confusion_matrix": cm.tolist(),
        "classes": DOCUMENT_CLASSES
    }
    with open(meta_path, "w", encoding="utf-8") as f:
        json.dump(metrics_summary, f, indent=2)
    print(f"Metrics report saved to: {meta_path}")

    print("\nLeakage-safe training and final held-out test evaluation completed.")

if __name__ == "__main__":
    main()
