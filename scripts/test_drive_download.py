import requests
import os

FILE_ID = "17w_mJbvjXLdG0zM1RWx_8yPs2WU_OS0g"
url = f"https://docs.google.com/uc?export=download&id={FILE_ID}"

session = requests.Session()
response = session.get(url, headers={"User-Agent": "Mozilla/5.0"}, timeout=15)
print("Status Code:", response.status_code)
print("Headers:", dict(response.headers))
print("First 1000 characters of body:\n", response.text[:1000])
