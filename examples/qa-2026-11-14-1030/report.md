# QA session: 2026-11-14 10:30

Issues: 3

## 1. Checkout button is too small and hard to find

- **Page:** `http://localhost:8765/index.html`
- **Title:** `Checkout · Corner Bakery`
- **Viewport:** 1280 × 800 (dpr 1)
- **Screenshot:** ./01-checkout-button-is-too-small-and-hard-to.png
- **Selector:** `aside.summary > button.btn-checkout`
- **Element:** `<button class="btn-checkout" type="button">`
- **Rect:** x 1068, y 319, w 71, h 22

It is the main action on the page but it looks like a footnote. Make it full width and the same height as the promo field.

## 2. Cinnamon rolls price sits lower than the others

- **Page:** `http://localhost:8765/index.html`
- **Title:** `Checkout · Corner Bakery`
- **Viewport:** 1280 × 800 (dpr 1)
- **Screenshot:** ./02-cinnamon-rolls-price-sits-lower-than-the.png
- **Selector:** `section.cart > div.cart-item:nth-of-type(2) > div.price`
- **Element:** `<div class="price">`
- **Rect:** x 696, y 306, w 55, h 18

The other prices are centred on the row. This one drops about 20px.

## 3. Move the newsletter box below the delivery info

- **Page:** `http://localhost:8765/index.html`
- **Title:** `Checkout · Corner Bakery`
- **Viewport:** 1280 × 800 (dpr 1)
- **Screenshot:** ./03-move-the-newsletter-box-below-the-delive.png

### Area 1

- **Selector:** `section.cart > div.newsletter`
- **Element:** `<div class="newsletter">`
- **Rect:** x 120, y 483, w 648, h 51

Delivery matters more at checkout. The newsletter offer should come last.

### Area 2

- **Selector:** `section.cart > div.delivery`
- **Element:** `<div class="delivery">`
- **Rect:** x 120, y 554, w 648, h 75

It goes after this block.
