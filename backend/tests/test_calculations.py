import unittest
from datetime import date
from decimal import Decimal
from app.calculations import ratio_of_sums, period_start, period_eff

class TestCalculations(unittest.TestCase):
    def test_ratio_not_average(self):
        rows=[{"min_output":90,"min_input":100,"easy_lean_line":"A"},{"min_output":10,"min_input":100,"easy_lean_line":"B"}]
        self.assertEqual(ratio_of_sums(rows),Decimal('0.5'))
    def test_all_rows_included_without_easy_lean_filter(self):
        rows=[{"min_output":90,"min_input":100,"easy_lean_line":" "},{"min_output":40,"min_input":80,"easy_lean_line":"A"}]
        self.assertEqual(ratio_of_sums(rows),Decimal('0.7222222222222222222222222222'))
    def test_zero_denominator(self): self.assertIsNone(ratio_of_sums([{"min_output":1,"min_input":0,"easy_lean_line":"A"}]))
    def test_period_boundaries(self):
        d=date(2026,5,13); self.assertEqual(period_start(d,'MTD'),date(2026,5,1)); self.assertEqual(period_start(d,'QTD'),date(2026,4,1)); self.assertEqual(period_start(d,'YTD'),date(2026,1,1))
    def test_mtd_ignores_previous_month(self):
        rows=[{"data_date":date(2026,4,30),"min_output":100,"min_input":100,"easy_lean_line":"A"},{"data_date":date(2026,5,1),"min_output":50,"min_input":100,"easy_lean_line":"A"}]
        self.assertEqual(period_eff(rows,date(2026,5,13),'MTD'),Decimal('.5'))
if __name__=='__main__': unittest.main()
