from dataclasses import dataclass, asdict
from typing import List, Optional
from selenium import webdriver
from bs4 import BeautifulSoup
import time
import requests
from django.core.files.base import ContentFile
import uuid

from get_data.models import Site, Style
from concurrent.futures import ThreadPoolExecutor, as_completed


MAN_URL = "https://www.pinterest.com/search/pins/?q=outfit%20men"
WOMAN_URL = "https://www.pinterest.com/search/pins/?q=outfit%20women"

scroll_pause = 3  # زمان انتظار بعد از هر اسکرول
# max_scrolls = 20  # تعداد دفعات اسکرول (محدودیت بذار)
max_scrolls = 1000  # تعداد دفعات اسکرول (محدودیت بذار)
scroll_step = 1500



def scrape_segment(url: str, site: Site, gender: bool, start_index: int, step: int):
    scrolls = max_scrolls / step
    start_scrolls = start_index * scrolls
    
    driver = webdriver.Chrome()
    driver.get(url)
    time.sleep(5)  # صبر کن تا صفحه اولیه بیاد
    
    for _ in range(int(start_scrolls)):
        driver.execute_script("window.scrollTo(0, document.body.scrollHeight);")
        time.sleep(1)


    for _ in range(int(scrolls)):
        html = driver.page_source
        soup = BeautifulSoup(html, "html.parser")
        
        items = soup.find_all("div", attrs={"data-grid-item-idx": True})

        for item in items:
            idx = item["data-grid-item-idx"]
            
            print()
            print("Index:", idx)
            
            try:
                
                a_element = item.select_one('.XiG.zI7 > div:nth-child(1) > a')
                url_style = a_element.get('href')
                title = a_element.get('aria-label')
                image_url = item.select_one('.XiG.zI7 > div:nth-child(1) > a > div > div > div > div > div.XiG.zI7 > div > div > div.zI7 > div > div > div > img').get('src')

                id_object = int(url_style.split("/")[-2])
                
                if not Style.objects.filter(id_object=id_object).exists():
                    style = Style.objects.create(
                        id_object=id_object,
                        title=title,
                        is_man=gender,
                        image=image_url,
                        site=site,
                        url=url_style
                    )
                    print(f"id_style: {style.id} ✅")
                    
                    # ---- دانلود و ذخیره عکس ----
                    try:
                        response = requests.get(image_url, timeout=10)
                        if response.status_code == 200:
                            file_name = f"{id_object}.jpg"
                            style.image_local.save(file_name, ContentFile(response.content), save=True)
                            print(f"Image saved locally: {style.image_local.path}")
                        else:
                            print(f"Failed to download image: {image_url}")
                    except Exception as e:
                        print(f"Error downloading image: {e}")
                    # # -----------------------------
                
                print(f"id_object: {id_object}")
                # print(f"title: {title}")
                # print(f"url_style: {url_style}")
                # print(f"image_url: {image_url}")
            except:
                print("Error")
            print("--------------------------------")
        
        # اسکرول تا پایین صفحه
        driver.execute_script(f"window.scrollBy(0, {scroll_step});")
        
        # صبر کن تا کانتنت جدید بیاد
        time.sleep(scroll_pause)


def main():
    # get site
    try:
        site = Site.objects.get(title="Pinterest")
    except Site.DoesNotExist:
        site = Site.objects.create(title="Pinterest", url="https://www.pinterest.com")
    
    # Run 5 threads per category with strided paging (1,6,11, ...), (2,7,12, ...), ...
    num = 2
    with ThreadPoolExecutor(max_workers=num*2) as executor:
        futures = []
        for start in range(num):
            futures.append(executor.submit(scrape_segment, MAN_URL, site, True, start, num))
            futures.append(executor.submit(scrape_segment, WOMAN_URL, site, False, start, num))
        for f in as_completed(futures):
            try:
                f.result(timeout=600)
            except Exception as e:
                print(f"Worker error: {e}")


if __name__ == "__main__":
    main()
