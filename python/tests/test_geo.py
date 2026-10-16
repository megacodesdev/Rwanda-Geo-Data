import unittest
import rwanda_geo_data as geo

COUNTS = {"provinces": 5, "districts": 30, "sectors": 416, "cells": 2149, "villages": 14837}


class GeoTests(unittest.TestCase):
    def test_country_and_provinces(self):
        self.assertEqual(geo.get_country(), "Rwanda")
        self.assertEqual(sorted(geo.get_provinces()), ["East", "Kigali", "North", "South", "West"])

    def test_counts(self):
        self.assertEqual(geo.count_locations(), COUNTS)
        self.assertEqual(geo.get_stats(), COUNTS)

    def test_districts(self):
        self.assertEqual(len(geo.get_districts()), 30)
        self.assertIn("Bugesera", geo.get_districts_by_province("east"))
        self.assertEqual(geo.get_districts_by_province("Nowhere"), [])
        self.assertEqual(geo.get_province_of("bugesera"), "East")

    def test_all_lookups(self):
        self.assertIn("Gashora", geo.get_sectors())
        self.assertIn("Biryogo", geo.get_cells())
        self.assertIn("Bidudu", geo.get_villages())
        self.assertEqual(len(set(geo.get_sectors())), len(geo.get_sectors()))

    def test_by_functions(self):
        self.assertIn("Gashora", geo.get_sectors_by_district("East", "Bugesera"))
        self.assertIn("Biryogo", geo.get_cells_by_sector("East", "Bugesera", "Gashora"))
        self.assertIn("Bidudu", geo.get_villages_by_cell("East", "Bugesera", "Gashora", "Biryogo"))

    def test_wrong_province(self):
        self.assertEqual(geo.get_sectors_by_district("West", "Bugesera"), [])
        self.assertEqual(geo.get_cells_by_sector("West", "Bugesera", "Gashora"), [])

    def test_case_insensitive(self):
        self.assertIn("Gashora", geo.get_sectors_by_district("EAST", "bugesera"))

    def test_short_calls(self):
        self.assertIn("Gashora", geo.get_sectors("Bugesera"))
        self.assertIn("Biryogo", geo.get_cells("Bugesera", "Gashora"))
        self.assertIn("Bidudu", geo.get_villages("Bugesera", "Gashora", "Biryogo"))

    def test_unknown(self):
        self.assertEqual(geo.get_sectors("Nowhere"), [])
        self.assertEqual(geo.get_cells("Bugesera", "Nowhere"), [])

    def test_valid_address(self):
        self.assertTrue(geo.is_valid_address("East", "Bugesera", "Gashora", "Biryogo", "Bidudu"))
        self.assertFalse(geo.is_valid_address("West", "Bugesera"))

    def test_search(self):
        r = geo.search("GASHORA", levels=["sector"])
        self.assertEqual(r[0]["district"], "Bugesera")
        r = geo.search("gashora bugesera")
        self.assertEqual((r[0]["name"], r[0]["level"]), ("Gashora", "sector"))
        self.assertTrue(all(x["district"] == "Bugesera" for x in r))
        self.assertEqual(geo.search("  Gáshóra  ", levels=["sector"])[0]["name"], "Gashora")
        self.assertEqual(geo.search(""), [])
        self.assertEqual(len(geo.search("a", limit=5)), 5)

    def test_random_location(self):
        for _ in range(20):
            loc = geo.get_random_location()
            self.assertTrue(geo.is_valid_address(**loc), loc)


if __name__ == "__main__":
    unittest.main()
