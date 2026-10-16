import unittest
import rwanda_geo_data as geo


class GeoTests(unittest.TestCase):
    def test_provinces(self):
        self.assertEqual(sorted(geo.get_provinces()), ["East", "Kigali", "North", "South", "West"])

    def test_stats(self):
        self.assertEqual(geo.get_stats(), {"provinces": 5, "districts": 30, "sectors": 416,
                                            "cells": 2149, "villages": 14837})

    def test_hierarchy(self):
        self.assertIn("Bugesera", geo.get_districts("east"))
        self.assertEqual(geo.get_province_of("bugesera"), "East")
        self.assertIn("Gashora", geo.get_sectors("BUGESERA"))
        self.assertIn("Biryogo", geo.get_cells("Bugesera", "gashora"))
        self.assertIn("Bidudu", geo.get_villages("Bugesera", "Gashora", "Biryogo"))

    def test_unknown(self):
        self.assertEqual(geo.get_sectors("Nowhere"), [])
        self.assertEqual(geo.get_cells("Bugesera", "Nowhere"), [])

    def test_valid_address(self):
        self.assertTrue(geo.is_valid_address("East", "Bugesera", "Gashora", "Biryogo", "Bidudu"))
        self.assertFalse(geo.is_valid_address("West", "Bugesera"))

    def test_search(self):
        r = geo.search("gashora", levels=["sector"])
        self.assertEqual(r[0]["district"], "Bugesera")


if __name__ == "__main__":
    unittest.main()
