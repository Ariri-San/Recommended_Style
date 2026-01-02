import json
import re
import sys
from dataclasses import dataclass, asdict
from typing import List, Optional

import requests
from bs4 import BeautifulSoup
from get_data.models import Site, Category, Product
from concurrent.futures import ThreadPoolExecutor, as_completed


MAN_URL = "https://www.digistyle.com/category-men-clothing/?pageno="
WOMAN_URL = "https://www.digistyle.com/category-womens-apparel/?pageno="


def clean_text(text):
    """تمیز کردن متن از فضاهای اضافی و کاراکترهای غیرضروری"""
    if not text:
        return text
    
    # حذف کاراکترهای جدید و فضاهای اضافی
    text = re.sub(r'\s+', ' ', text)
    text = text.strip()
    
    # حذف نقاط چین در انتهای عنوان
    if text.endswith('...'):
        text = text[:-3]
    
    return text

def clean_price(price_text):
    """تمیز کردن متن قیمت و تبدیل به فرمت استاندارد"""
    if not price_text:
        return price_text
    
    # حذف همه کاراکترهای غیرعددی به جز کاما
    cleaned_price = re.sub(r'[^\d,]', '', price_text)
    
    # حذف کاماها برای محاسبات عددی
    numeric_price = cleaned_price.replace(',', '')
    
    try:
        return int(numeric_price)
    except ValueError:
        return price_text




def scrape_digistyle_segment(url: str, site: Site, gender: bool, start_page: int, step: int):
    page = start_page
    
    while True:
        current_url = url + str(page)
        response = requests.get(current_url)
        
        if response.status_code != 200:
            break
        
        soup = BeautifulSoup(response.content, 'html.parser')
        
        for i in range(1, 37):
            elements = soup.select(f'#productGrid > div:nth-child({i})')
            if not elements:
                continue
            product_element = elements[0]
            
            title = product_element.select_one('.c-product-card__title-row > a')
            url_product = product_element.select_one('.c-product-card__image-container.ga-product-impression').get('href')
            price_el = product_element.select_one('.c-product-card__price > div')
            image_el = product_element.select_one('.c-product-card__image-container.ga-product-impression > img')
            
            if not title or not price_el or not image_el:
                continue
            
            title_text = title.getText(strip=True)
            price_text = price_el.getText(strip=True)
            image_url = image_el.get('src')
            
            try:
                product = Product.objects.get(
                    url=url_product
                )
                product.price = clean_price(price_text)
                product.image = image_url
                product.save()
            except:
                product = Product.objects.create(
                    title=clean_text(title_text),
                    price=clean_price(price_text),
                    is_man=gender,
                    image=image_url,
                    site=site,
                    url=url_product
                )
            
            print()
            print(f"id: {product.id}")
            # print(f"url: {url}")
            # print(f"price: {clean_text(price_text)}")
            # print(f"price: {clean_price(price_text)}")
            # print(f"image_url: {image_url}")
            # print("--------------------------------")
        
        page += step
        # if page > 1 :
        #     break


def main():
    # get site
    try:
        site = Site.objects.get(title="Digistyle")
    except Site.DoesNotExist:
        site = Site.objects.create(title="Digistyle", url="https://www.digistyle.com")
    
    # Run 5 threads per category with strided paging (1,6,11, ...), (2,7,12, ...), ...
    num = 4
    with ThreadPoolExecutor(max_workers=num*2) as executor:
        futures = []
        for start in range(1, 1+num):
            futures.append(executor.submit(scrape_digistyle_segment, MAN_URL, site, True, start, num))
            futures.append(executor.submit(scrape_digistyle_segment, WOMAN_URL, site, False, start, num))
        for f in as_completed(futures):
            try:
                f.result(timeout=30)
            except Exception as e:
                print(f"Worker error: {e}")


if __name__ == "__main__":
    main()
