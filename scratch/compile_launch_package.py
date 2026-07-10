import os
from reportlab.lib.pagesizes import letter, landscape
from reportlab.lib.units import inch
from reportlab.pdfgen import canvas
from reportlab.lib.colors import HexColor

# Page settings: Landscape Letter (11 x 8.5 inches = 792 x 612 points)
PAGE_WIDTH, PAGE_HEIGHT = landscape(letter)
BG_COLOR = HexColor("#111111")
TEXT_COLOR = HexColor("#F5F5F5")
MUTED_TEXT = HexColor("#888888")

# Assets directory and target PDF
BRAIN_DIR = r"C:\Users\1\.gemini\antigravity\brain\422ec6ef-f666-47b1-b555-238de84b2656"
OUTPUT_PDF = os.path.join(BRAIN_DIR, "uncanny_google_play_launch_package_v2.pdf")

# Individual asset mappings (checking exact existence or fallback)
ASSETS = {
    "icon_presentation": os.path.join(BRAIN_DIR, "uncanny_iris_v2_1780116232500.png"),
    "icon_light": os.path.join(BRAIN_DIR, "uncanny_iris_v3_1780116247162.png"),
    "feature_graphic": os.path.join(BRAIN_DIR, "uncanny_feature_rev_1780117405383.png"),
    "screenshot_1": os.path.join(BRAIN_DIR, "uncanny_screenshot_1_1780116758307.png"),
    "screenshot_2": os.path.join(BRAIN_DIR, "uncanny_screen_2_rev_1780117421063.png"),
    "screenshot_3": os.path.join(BRAIN_DIR, "uncanny_screenshot_3_1780117050247.png"),
    "screenshot_4": os.path.join(BRAIN_DIR, "uncanny_screen_4_rev_1780117436635.png"),
    "screenshot_5": os.path.join(BRAIN_DIR, "uncanny_screen_5_rev_1780117454310.png"),
    "preview_grid": os.path.join(BRAIN_DIR, "uncanny_preview_grid_1780116261127.png"),
    "play_store_mockup": os.path.join(BRAIN_DIR, "uncanny_play_store_mockup_1780116276787.png"),
    "home_screen_mockup": os.path.join(BRAIN_DIR, "uncanny_home_screen_mockup_1780116295445.png")
}

def draw_slide_background(c):
    c.setFillColor(BG_COLOR)
    c.rect(0, 0, PAGE_WIDTH, PAGE_HEIGHT, fill=True, stroke=False)

def draw_footer(c, slide_number):
    c.setFont("Helvetica-Bold", 8)
    c.setFillColor(TEXT_COLOR)
    c.drawString(40, 30, "UNCANNY  |  GOOGLE PLAY LAUNCH ASSET PACKAGE")
    
    c.setFont("Helvetica", 8)
    c.setFillColor(MUTED_TEXT)
    c.drawRightString(PAGE_WIDTH - 40, 30, f"PAGE {slide_number} OF 8")

def build_pdf():
    c = canvas.Canvas(OUTPUT_PDF, pagesize=(PAGE_WIDTH, PAGE_HEIGHT))
    
    # ----------------------------------------------------
    # SLIDE 1: COVER PAGE
    # ----------------------------------------------------
    draw_slide_background(c)
    
    # Title
    c.setFont("Helvetica-Bold", 42)
    c.setFillColor(TEXT_COLOR)
    c.drawString(60, PAGE_HEIGHT - 160, "U N C A N N Y")
    
    c.setFont("Helvetica-Bold", 16)
    c.setFillColor(MUTED_TEXT)
    c.drawString(60, PAGE_HEIGHT - 210, "GOOGLE PLAY LAUNCH ASSET PACKAGE")
    
    # Subtitle clinical detail
    c.setFont("Helvetica", 11)
    c.setFillColor(TEXT_COLOR)
    c.drawString(60, PAGE_HEIGHT - 320, "SUBTITLE: Daily Perception Test")
    c.drawString(60, PAGE_HEIGHT - 345, "PROMISE: Real photographs. Synthetic images. Decide which is which.")
    c.drawString(60, PAGE_HEIGHT - 370, "AUDIT CODE: PRCP-GTM-2026")
    
    # Draw Cover Icon on the right
    if os.path.exists(ASSETS["icon_presentation"]):
        c.drawImage(ASSETS["icon_presentation"], PAGE_WIDTH - 380, PAGE_HEIGHT - 440, width=320, height=320)
        
    draw_footer(c, 1)
    c.showPage()
    
    # ----------------------------------------------------
    # SLIDE 2: BRAND OVERVIEW
    # ----------------------------------------------------
    draw_slide_background(c)
    
    c.setFont("Helvetica-Bold", 24)
    c.setFillColor(TEXT_COLOR)
    c.drawString(60, PAGE_HEIGHT - 80, "01. BRAND OVERVIEW & STRATEGIC POSITIONING")
    
    # Write details
    c.setFont("Helvetica-Bold", 12)
    c.drawString(60, PAGE_HEIGHT - 140, "BRAND PROMISE & CORE VALUES")
    c.setFont("Helvetica", 10)
    c.setFillColor(HexColor("#CCCCCC"))
    lines = [
        "UNCANNY targets pure visual perception, observation, and cognitive judgment.",
        "It deliberately avoids security overlays, gaming targets, futuristic HUD elements, or hacker fantasies.",
        "The objective is to establish an atmospheric, high-end daily habit loop based on visual trust.",
        "",
        "POSITIONING MATRIX:",
        "  - Premium: Apple-level restraint, monochrome clinical color space, raw photographic integrity.",
        "  - Psychological: Liminal domestic rooms, quiet foggy spaces, and unsettling organic tension.",
        "  - Editorial: Built strictly with Space Mono typography, flat matte backings, and zero arcade rewards."
    ]
    y_pos = PAGE_HEIGHT - 170
    for line in lines:
        c.drawString(60, y_pos, line)
        y_pos -= 20
        
    # Visual grid on the right side
    if os.path.exists(ASSETS["icon_light"]):
        # Miniature Light variant
        c.drawImage(ASSETS["icon_light"], PAGE_WIDTH - 340, PAGE_HEIGHT - 380, width=240, height=240)
        c.setFont("Helvetica-Bold", 8)
        c.setFillColor(TEXT_COLOR)
        c.drawCentredString(PAGE_WIDTH - 220, PAGE_HEIGHT - 400, "VARIANT C: CLINICAL OFF-WHITE ASPECT")
        
    draw_footer(c, 2)
    c.showPage()
    
    # ----------------------------------------------------
    # SLIDE 3: APP ICON PRESENTATION
    # ----------------------------------------------------
    draw_slide_background(c)
    
    c.setFont("Helvetica-Bold", 24)
    c.setFillColor(TEXT_COLOR)
    c.drawString(60, PAGE_HEIGHT - 80, "02. APP ICON: FRACTURED IRIS (VARIANT B)")
    
    # Icon specifications
    c.setFont("Helvetica-Bold", 12)
    c.drawString(60, PAGE_HEIGHT - 140, "SPECIFICATIONS & DESIGN CODES")
    c.setFont("Helvetica", 10)
    c.setFillColor(HexColor("#CCCCCC"))
    spec_lines = [
        "  - Background: Warm Charcoal (#111111) representing high-end gallery paper.",
        "  - Symbol: Solid Off-White circular aperture iris.",
        "  - Simplification: Reduced segment complexity by 35% for maximum small-size legacy.",
        "  - Anomaly: Segment #3 is rotated outward by exactly 3.8 degrees.",
        "  - Psychology: Triggers the feeling that 'something is slightly off' without glitched pixels.",
        "",
        "SMALL-SCALE VISIBILITY METRICS:"
    ]
    y_pos = PAGE_HEIGHT - 170
    for line in spec_lines:
        c.drawString(60, y_pos, line)
        y_pos -= 22
        
    if os.path.exists(ASSETS["preview_grid"]):
        c.drawImage(ASSETS["preview_grid"], 60, 100, width=320, height=140)
        
    # Main Icon image
    if os.path.exists(ASSETS["icon_presentation"]):
        c.drawImage(ASSETS["icon_presentation"], PAGE_WIDTH - 360, PAGE_HEIGHT - 420, width=300, height=300)
        
    draw_footer(c, 3)
    c.showPage()
    
    # ----------------------------------------------------
    # SLIDE 4: FEATURE GRAPHIC
    # ----------------------------------------------------
    draw_slide_background(c)
    
    c.setFont("Helvetica-Bold", 24)
    c.drawString(60, PAGE_HEIGHT - 80, "03. GOOGLE PLAY FEATURE GRAPHIC")
    
    # Details
    c.setFont("Helvetica-Bold", 12)
    c.drawString(60, PAGE_HEIGHT - 130, "DIMENSIONS: 1024 x 500  |  HEADER: CAN YOU TRUST YOUR EYES?")
    c.setFont("Helvetica", 10)
    c.setFillColor(HexColor("#CCCCCC"))
    fg_lines = [
        "  - Design Rationale: Strips all sci-fi scanner lines or gaming targets.",
        "  - Visual Concept: Exhibits a classification grid containing a quiet, eerie liminal corridor.",
        "  - The Hook: Triggers immediate cognitive curiosity rather than generic tech-toy appeal."
    ]
    y_pos = PAGE_HEIGHT - 160
    for line in fg_lines:
        c.drawString(60, y_pos, line)
        y_pos -= 20
        
    if os.path.exists(ASSETS["feature_graphic"]):
        c.drawImage(ASSETS["feature_graphic"], 60, 80, width=672, height=328)
        
    draw_footer(c, 4)
    c.showPage()
    
    # ----------------------------------------------------
    # SLIDE 5: SCREENSHOT SEQUENCE (1, 2, 3)
    # ----------------------------------------------------
    draw_slide_background(c)
    
    c.setFont("Helvetica-Bold", 24)
    c.drawString(60, PAGE_HEIGHT - 80, "04. SCREENSHOT SEQUENCE: STAGES 1 - 3")
    
    # Previews side by side
    # Landscape aspect: each screenshot is vertical. 
    # Height = 340 points. Width = 340 * 1080 / 1920 = 191 points.
    w_sc, h_sc = 191, 340
    
    if os.path.exists(ASSETS["screenshot_1"]):
        c.drawImage(ASSETS["screenshot_1"], 60, 100, width=w_sc, height=h_sc)
        c.setFont("Helvetica-Bold", 10)
        c.drawCentredString(60 + w_sc/2, 80, "01. THE HOOK")
        
    if os.path.exists(ASSETS["screenshot_2"]):
        c.drawImage(ASSETS["screenshot_2"], 60 + w_sc + 40, 100, width=w_sc, height=h_sc)
        c.setFont("Helvetica-Bold", 10)
        c.drawCentredString(60 + w_sc + 40 + w_sc/2, 80, "02. THE INVESTIGATION")
        
    if os.path.exists(ASSETS["screenshot_3"]):
        c.drawImage(ASSETS["screenshot_3"], 60 + (w_sc + 40)*2, 100, width=w_sc, height=h_sc)
        c.setFont("Helvetica-Bold", 10)
        c.drawCentredString(60 + (w_sc + 40)*2 + w_sc/2, 80, "03. THE SOCIAL PROOF")
        
    draw_footer(c, 5)
    c.showPage()
    
    # ----------------------------------------------------
    # SLIDE 6: SCREENSHOT SEQUENCE (4, 5) & RITUAL
    # ----------------------------------------------------
    draw_slide_background(c)
    
    c.setFont("Helvetica-Bold", 24)
    c.drawString(60, PAGE_HEIGHT - 80, "05. SCREENSHOT SEQUENCE: STAGES 4 - 5")
    
    w_sc, h_sc = 191, 340
    
    if os.path.exists(ASSETS["screenshot_4"]):
        c.drawImage(ASSETS["screenshot_4"], 60, 100, width=w_sc, height=h_sc)
        c.setFont("Helvetica-Bold", 10)
        c.drawCentredString(60 + w_sc/2, 80, "04. THE HABIT (STREAKS)")
        
    if os.path.exists(ASSETS["screenshot_5"]):
        c.drawImage(ASSETS["screenshot_5"], 60 + w_sc + 40, 100, width=w_sc, height=h_sc)
        c.setFont("Helvetica-Bold", 10)
        c.drawCentredString(60 + w_sc + 40 + w_sc/2, 80, "05. THE DEPTH (REFLECTION)")
        
    # Text on the right
    c.setFont("Helvetica-Bold", 12)
    c.drawString(PAGE_WIDTH - 280, PAGE_HEIGHT - 160, "RITUAL COMPLIANCE CHECK")
    c.setFont("Helvetica", 9)
    c.setFillColor(HexColor("#CCCCCC"))
    checks = [
        "▣ No game coins or arcade stars.",
        "▣ No flashing laser scanners.",
        "▣ No technological UI noise.",
        "▣ Pure focus on empty space atmospheres",
        "  and deep perception scoring.",
        "",
        "Optimized to hook and retain high-value",
        "analytical daily players."
    ]
    y_pos = PAGE_HEIGHT - 190
    for line in checks:
        c.drawString(PAGE_WIDTH - 280, y_pos, line)
        y_pos -= 18
        
    draw_footer(c, 6)
    c.showPage()
    
    # ----------------------------------------------------
    # SLIDE 7: APP MOCKUPS (STORE & LAUNCHER)
    # ----------------------------------------------------
    draw_slide_background(c)
    
    c.setFont("Helvetica-Bold", 24)
    c.drawString(60, PAGE_HEIGHT - 80, "06. DEVICE & PLAY STORE LISTING MOCKUPS")
    
    w_mock, h_mock = 310, 360
    
    if os.path.exists(ASSETS["play_store_mockup"]):
        c.drawImage(ASSETS["play_store_mockup"], 60, 100, width=w_mock, height=h_mock)
        c.setFont("Helvetica-Bold", 10)
        c.drawCentredString(60 + w_mock/2, 80, "GOOGLE PLAY STORE SEARCH RANKING")
        
    if os.path.exists(ASSETS["home_screen_mockup"]):
        c.drawImage(ASSETS["home_screen_mockup"], PAGE_WIDTH - 60 - w_mock, 100, width=w_mock, height=h_mock)
        c.setFont("Helvetica-Bold", 10)
        c.drawCentredString(PAGE_WIDTH - 60 - w_mock/2, 80, "SMARTPHONE HOME SCREEN INTERFACE")
        
    draw_footer(c, 7)
    c.showPage()
    
    # ----------------------------------------------------
    # SLIDE 8: FINAL LAUNCH RECOMMENDATIONS
    # ----------------------------------------------------
    draw_slide_background(c)
    
    c.setFont("Helvetica-Bold", 24)
    c.drawString(60, PAGE_HEIGHT - 80, "07. FINAL LAUNCH & GTM RECOMMENDATIONS")
    
    c.setFont("Helvetica-Bold", 14)
    c.drawString(60, PAGE_HEIGHT - 140, "IMMEDIATE STEPS TO DEPLOYMENT")
    
    c.setFont("Helvetica", 10)
    c.setFillColor(HexColor("#CCCCCC"))
    rec_lines = [
        "1. UPLOAD STARK ASSETS: Push the Variant B Icon and the 5 vertical screenshots to the Play Console.",
        "2. CONFIGURE METADATA: Employ the refined high-curiosity description text on the main app dashboard.",
        "3. RUN PLAY STORE CLOSED TEST: Recruit 20 internal testers to participate for 14 days.",
        "4. PRE-REGISTER DOMAIN & CORs: Map uncanny-game.com to Vercel and secure native WebView CORS origin fetches.",
        "5. LOCK CAPACITOR BUILDS: Scaffold our Capacitor wrapper project and compile signed debug packages."
    ]
    y_pos = PAGE_HEIGHT - 170
    for line in rec_lines:
        c.drawString(60, y_pos, line)
        y_pos -= 24
        
    c.setFont("Helvetica-Bold", 12)
    c.setFillColor(TEXT_COLOR)
    c.drawString(60, y_pos - 30, "SUCCESS METRIC TARGETS:")
    c.setFont("Helvetica", 10)
    c.setFillColor(HexColor("#CCCCCC"))
    metrics = [
        "- Sizing Legibility: 100% silhouette clarity at 48px.",
        "- Curiosity Conversion: >30% organic click-through rate over generic competitor listings.",
        "- Long-Term Retention: >40% day-7 cohort return rate driven by daily morning moral streaks."
    ]
    y_pos_m = y_pos - 60
    for metric in metrics:
        c.drawString(60, y_pos_m, metric)
        y_pos_m -= 20
        
    # Miniature visual stamp
    if os.path.exists(ASSETS["icon_presentation"]):
        c.drawImage(ASSETS["icon_presentation"], PAGE_WIDTH - 200, 100, width=140, height=140)
        
    draw_footer(c, 8)
    c.showPage()
    
    c.save()
    print("PDF successfully constructed at:", OUTPUT_PDF)

if __name__ == "__main__":
    build_pdf()
