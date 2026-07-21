import re
import sys

css_path = r'C:\Pictures\StoryKami\template\template-daerahJawa\assets\css\style.css'
with open(css_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Replace the entire block from /* ===== GIFT CARDS (WIM Engine Generated) ===== */ to /* ============================================== */

new_css = r'''/* ===== GIFT CARDS (WIM Engine Generated) ===== */
.bank-card {
    background-color: #f3ece1;
    border: 1px solid #e0d5c1;
    border-radius: 16px;
    padding: 25px;
    margin-bottom: 20px;
    box-shadow: 0 4px 6px rgba(0,0,0,0.05);
    position: relative;
    z-index: 10;
}
.card-top-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 25px;
}
.bank-card-title {
    font-family: 'Playfair Display', serif;
    font-size: 1.5rem;
    font-weight: 700;
    color: #333;
    margin: 0;
}
.bank-logo-container {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    width: 140px;
    background: transparent;
    padding: 0;
    border: none;
}
.bank-logo {
    max-height: 25px;
    max-width: 80px;
    object-fit: contain;
    margin-bottom: 8px;
}
.bank-divider {
    width: 100%;
    border: none;
    border-top: 2px solid #111;
    margin: 0;
    opacity: 1;
}
.card-body-row {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
}
.card-left {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 15px;
    width: 45%;
}
.card-icon {
    font-size: 4rem;
    color: #111;
    margin-bottom: 5px;
}
.card-buttons {
    display: flex;
    flex-direction: column;
    gap: 10px;
    width: 100%;
}
.btn-bank {
    width: 100%;
    text-align: center;
    border: none;
    border-radius: 8px;
    padding: 8px 10px;
    font-size: 0.85rem;
    font-weight: 600;
    cursor: pointer;
    text-decoration: none;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 5px;
    transition: all 0.3s ease;
}
.btn-copy {
    background-color: #111;
    color: #fff;
}
.btn-copy:hover {
    background-color: #333;
}
.btn-wa {
    background-color: #5c8526;
    color: #fff;
}
.btn-wa:hover {
    background-color: #4a6b1f;
}
.card-right {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    text-align: right;
    width: 50%;
}
.bank-details-wrapper {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 4px;
}
.bank-label {
    font-family: 'Playfair Display', serif;
    font-size: 1rem;
    color: #555;
    margin: 0;
}
.bank-label.mt-2 {
    margin-top: 15px !important;
}
.bank-number {
    font-family: 'Inter', sans-serif;
    font-size: 1.4rem;
    font-weight: 700;
    color: #333;
    margin: 0;
}
.bank-name {
    font-family: 'Inter', sans-serif;
    font-size: 1.05rem;
    font-weight: 700;
    color: #333;
    margin: 0;
    text-transform: uppercase;
}
/* ============================================== */'''

# Find the block and replace
content = re.sub(r'/\* ===== GIFT CARDS \(WIM Engine Generated\) ===== \*/[\s\S]*?/\* ============================================== \*/', new_css, content)

with open(css_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("CSS updated for new Bank Card design")
