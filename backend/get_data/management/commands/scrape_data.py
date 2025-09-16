from django.core.management.base import BaseCommand
from get_data.scripts.digistyle_scraper import main as digistyle_scraper
from get_data.scripts.pinterest_scraper import main as pinterest_scraper
import traceback
import time


class Command(BaseCommand):
    help = "Scrape Digistyle and store products in the database"
    
    def add_arguments(self, parser):
        parser.add_argument("--site", type=str, default="p", help="Select Site digistyle/pinterest or d/p")

    def handle(self, *args, **options):
        site = options["site"]
        
        try:
            start_ts = time.time()
            
            if site.lower() in ["digistyle", "d"]:
                digistyle_scraper()
            elif site.lower() in ["pinterest", "p"]:
                pinterest_scraper()
            
            elapsed = time.time() - start_ts
            self.stdout.write(self.style.SUCCESS(f"Scraping completed successfully in {elapsed:.2f} seconds."))
        except Exception as e:
            self.stdout.write(self.style.ERROR(f"ERROR: {e}"))
            self.stderr.write(self.style.ERROR(traceback.format_exc()))