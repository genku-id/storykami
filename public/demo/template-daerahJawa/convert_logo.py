from PIL import Image

try:
    img = Image.open('logo.png')
    img.save('logo.webp', 'webp')
    print('Successfully converted logo.png to logo.webp')
except Exception as e:
    print(f'Error: {e}')
