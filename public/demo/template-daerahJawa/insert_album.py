import os

html_path = 'index.html'
with open(html_path, 'r', encoding='utf-8') as f:
    content = f.read()

album_section = """
        <!-- Album Section -->
        <section id="album" class="section album-section" style="position: relative; width: 100%; background: radial-gradient(circle, #b8a18a 0%, #9e816a 100%); display: flex; flex-direction: column; justify-content: flex-start; align-items: center; overflow: hidden; z-index: 10; padding-top: 100px; padding-bottom: 0; height: auto;">
            <!-- Jawa Top Border -->
            <div class="jawa-top-border"></div>
            
            <div class="album-content-wrapper" style="position: relative; z-index: 3; width: calc(100% - 40px); max-width: 800px; margin: 0 auto 50px auto; text-align: center;">
                <h2 class="title-names-serif" data-animate="fade-up" style="font-family: 'Oleo Script', cursive;  color: #4a2c16; margin-bottom: 40px; font-size: 3rem; ">Album Kami</h2>
                
                <div class="gallery-grid" style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px;">
                    <!-- Photos -->
                    <div style="border-radius: 10px; overflow: hidden; box-shadow: 0 4px 10px rgba(0,0,0,0.2);">
                        <img src="https://images.unsplash.com/photo-1519741497674-611481863552?w=600&h=800&fit=crop" style="width: 100%; height: 100%; object-fit: cover; display: block;" alt="Prewedding 1">
                    </div>
                    <div style="border-radius: 10px; overflow: hidden; box-shadow: 0 4px 10px rgba(0,0,0,0.2);">
                        <img src="https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=600&h=800&fit=crop" style="width: 100%; height: 100%; object-fit: cover; display: block;" alt="Prewedding 2">
                    </div>
                    <div style="border-radius: 10px; overflow: hidden; box-shadow: 0 4px 10px rgba(0,0,0,0.2); grid-column: span 2;">
                        <img src="https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=1200&h=600&fit=crop" style="width: 100%; height: 100%; object-fit: cover; display: block;" alt="Prewedding 3">
                    </div>
                    <div style="border-radius: 10px; overflow: hidden; box-shadow: 0 4px 10px rgba(0,0,0,0.2);">
                        <img src="https://images.unsplash.com/photo-1520854221256-17451cc331bf?w=600&h=600&fit=crop" style="width: 100%; height: 100%; object-fit: cover; display: block;" alt="Prewedding 4">
                    </div>
                    <div style="border-radius: 10px; overflow: hidden; box-shadow: 0 4px 10px rgba(0,0,0,0.2);">
                        <img src="https://images.unsplash.com/photo-1523438885200-e635ba2c371e?w=600&h=600&fit=crop" style="width: 100%; height: 100%; object-fit: cover; display: block;" alt="Prewedding 5">
                    </div>
                </div>
            </div>

            <!-- Wayang & Bottom Border -->
            <div class="jawa-bottom-container" style="position: relative; width: 100%; display: flex; flex-direction: column; align-items: center; z-index: 2; margin-top: auto;">
                <div class="wayang-wrapper" style="position: relative; width: 100%; height: auto; z-index: 4;">
                    <img src="assets/images/wayang.webp" class="jawa-wayang center" alt="wayang">
                </div>
                <div class="jawa-bottom-border"></div>
            </div>
        </section>

        <!-- Wedding Gift Section -->"""

content = content.replace('<!-- Wedding Gift Section -->', album_section)

with open(html_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Inserted album section.")
