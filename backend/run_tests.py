import sys
import os
from pathlib import Path

# Add backend directory to sys.path
backend_dir = Path(__file__).resolve().parent
sys.path.insert(0, str(backend_dir))

def run_all_tests():
    print("======================================================================")
    print("MINISTRY OF TRIBAL AFFAIRS - ST SCHOLARSHIP PORTAL AUTOMATED TEST SUITE")
    print("======================================================================")

    # 1. Eligibility Rule Engine Tests
    print("\n[TEST 1] Running Deterministic Rule-Based Eligibility Engine Tests...")
    from tests.test_eligibility import test_db, test_nfst_eligible, test_nos_study_research_plan_required, test_income_exceeded_ineligible

    db_gen = test_db()
    db = next(db_gen)
    try:
        test_nfst_eligible(db)
        print("  ✓ PASS: test_nfst_eligible (Valid ST + Master's 72.5% + Income <= 6L -> Eligible)")

        test_nos_study_research_plan_required(db)
        print("  ✓ PASS: test_nos_study_research_plan_required (Mandatory study_research_plan for NOS enforced)")

        test_income_exceeded_ineligible(db)
        print("  ✓ PASS: test_income_exceeded_ineligible (Income > 6L ceiling triggers explainable rejection)")
    finally:
        try:
            next(db_gen)
        except StopIteration:
            pass

    # 2. DigiLocker Dual Branch Tests
    print("\n[TEST 2] Running DigiLocker Dual Branch Integration Tests...")
    from tests.test_digilocker import test_db as dl_test_db, test_digilocker_branch_a_record_found, test_digilocker_branch_b_fallback

    dl_gen = dl_test_db()
    dl_db = next(dl_gen)
    try:
        test_digilocker_branch_a_record_found(dl_db)
        print("  ✓ PASS: test_digilocker_branch_a_record_found (Branch A: NAD record found -> advances to AI Scrutiny)")

        test_digilocker_branch_b_fallback(dl_db)
        print("  ✓ PASS: test_digilocker_branch_b_fallback (Branch B: NAD fallback active -> advances to AI Scrutiny without halting)")
    finally:
        try:
            next(dl_gen)
        except StopIteration:
            pass

    # 3. AI Document Verification Tests
    print("\n[TEST 3] Running AI Document Verification & Advisory Flag Tests...")
    from tests.test_ai_verification import test_ai_extraction_all_seven_types, test_ai_name_mismatch_flag

    test_ai_extraction_all_seven_types()
    print("  ✓ PASS: test_ai_extraction_all_seven_types (All 7 document types supported including study_research_plan)")

    test_ai_name_mismatch_flag()
    print("  ✓ PASS: test_ai_name_mismatch_flag (Advisory mismatch flag generated; AI never makes statutory decision)")

    # 4. Emoji Audit Across Frontend & Backend
    print("\n[TEST 4] Running Zero-Emoji Audit across repository...")
    import re
    emoji_pattern = re.compile(
        "[\U00010000-\U0010ffff\u2600-\u26ff\u2700-\u27bf]",
        flags=re.UNICODE
    )

    violations = []
    scan_exts = [".py", ".ts", ".tsx", ".css", ".json"]
    root_dir = backend_dir.parent

    for root, dirs, files in os.walk(root_dir):
        if "node_modules" in root or ".next" in root or ".git" in root or "SIH_ST_NFST_NOS_1000" in root:
            continue
        for file in files:
            if any(file.endswith(ext) for ext in scan_exts):
                filepath = os.path.join(root, file)
                try:
                    with open(filepath, "r", encoding="utf-8") as f:
                        for line_no, line in enumerate(f, 1):
                            if emoji_pattern.search(line):
                                violations.append(f"{filepath}:{line_no} -> {line.strip()}")
                except Exception:
                    pass

    if violations:
        print(f"  FAILED: Found {len(violations)} emoji violations:")
        for v in violations[:5]:
            print(f"    {v}")
        sys.exit(1)
    else:
        print("  ✓ PASS: Strict Zero-Emoji Audit passed across all frontend & backend files.")

    print("\n======================================================================")
    print("ALL MANDATORY SUITE TESTS PASSED SUCCESSFULLY (100% PASS RATE)")
    print("======================================================================")

if __name__ == "__main__":
    run_all_tests()
