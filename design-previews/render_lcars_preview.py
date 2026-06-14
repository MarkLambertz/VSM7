from PIL import Image, ImageDraw, ImageFont

W, H = 1920, 1080
BG = "#050507"
PANEL = "#101014"
PANEL_2 = "#19181f"
INK = "#f4eee6"
MUTED = "#aaa3b1"
PEACH = "#efb298"
ORANGE = "#d87931"
AMBER = "#e7b447"
LAVENDER = "#a995c8"
VIOLET = "#725f9b"
BLUE = "#718dbd"
CYAN = "#72b5be"
GREEN = "#72a87a"
RED = "#c95b58"
LINE = "#37353f"

FONT = "/System/Library/Fonts/Supplemental/Arial.ttf"
BOLD = "/System/Library/Fonts/Supplemental/Arial Bold.ttf"
BLACK = "/System/Library/Fonts/Supplemental/Arial Black.ttf"


def font(size, bold=False, black=False):
    return ImageFont.truetype(BLACK if black else BOLD if bold else FONT, size)


img = Image.new("RGB", (W, H), BG)
d = ImageDraw.Draw(img)


def txt(xy, value, size=14, color=INK, bold=False, black=False, anchor=None):
    d.text(xy, value, fill=color, font=font(size, bold, black), anchor=anchor)


def rr(box, radius, fill, outline=None, width=1):
    d.rounded_rectangle(box, radius, fill=fill, outline=outline, width=width)


def pill(x, y, text, color=LAVENDER, w=None):
    w = w or max(72, 18 + len(text) * 7)
    rr((x, y, x + w, y + 28), 14, color)
    txt((x + w / 2, y + 14), text.upper(), 10, BG, True, anchor="mm")
    return w


def screen(x, y, w, h, label):
    rr((x, y, x + w, y + h), 28, PANEL, LINE, 2)
    d.rounded_rectangle((x, y, x + 30, y + h), 28, fill=ORANGE)
    segments = [(x + 30, x + w * .24, PEACH), (x + w * .25, x + w * .46, LAVENDER),
                (x + w * .47, x + w * .72, ORANGE), (x + w * .73, x + w, BLUE)]
    for left, right, color in segments:
        d.rectangle((left, y, right, y + 14), fill=color)
    txt((x + 52, y + 27), label.upper(), 12, ORANGE, True)
    return x + 52, y + 52, x + w - 18, y + h - 18


def appbar(x, y, right, title, context="", completion=None):
    rr((x, y, x + 76, y + 32), 16, PEACH)
    txt((x + 38, y + 16), "VSM7", 13, BG, True, anchor="mm")
    txt((x + 88, y + 8), title, 14, INK, True)
    if context:
        txt((x + 88, y + 25), context.upper(), 9, MUTED)
    if completion:
        pill(right - 150, y + 2, completion, AMBER, 150)


def micro_rail(x, y, w):
    widths = [.24, .18, .31, .24]
    colors = [ORANGE, PEACH, LAVENDER, BLUE]
    cursor = x
    for ratio, color in zip(widths, colors):
        seg = int(w * ratio)
        rr((cursor, y, cursor + seg, y + 8), 4, color)
        cursor += seg + 5


def heading(x, y, eyebrow, title, size=24):
    txt((x, y), eyebrow.upper(), 10, MUTED, True)
    txt((x, y + 17), title.upper(), size, INK, True)


def nav_item(x, y, numeral, label, active=False):
    bg = PEACH if active else "#282630"
    rr((x, y, x + 142, y + 35), 18, bg)
    rr((x, y, x + 40, y + 35), 18, ORANGE if active else VIOLET)
    txt((x + 20, y + 18), numeral, 11, BG, True, anchor="mm")
    txt((x + 48, y + 18), label.upper(), 8, BG if active else INK, True, anchor="lm")


def slider(x, y, label, width, pct):
    txt((x, y), label, 9, MUTED)
    line_y = y + 22
    d.line((x, line_y, x + width, line_y), fill="#5b5664", width=3)
    cx = x + width * pct
    d.ellipse((cx - 8, line_y - 8, cx + 8, line_y + 8), fill=CYAN, outline=PANEL_2, width=3)


def table(x, y, widths, rows, row_h=30):
    colors = [VIOLET] + [PANEL_2] * (len(rows) - 1)
    for row_index, row in enumerate(rows):
        cursor = x
        for col_index, cell in enumerate(row):
            fill = colors[row_index]
            if isinstance(cell, tuple):
                cell, fill = cell
            d.rectangle((cursor, y + row_index * row_h, cursor + widths[col_index] - 2,
                         y + (row_index + 1) * row_h - 2), fill=fill)
            txt((cursor + 7, y + row_index * row_h + row_h / 2), str(cell), 9,
                BG if row_index == 0 or fill in (AMBER, GREEN, RED) else INK,
                True if row_index == 0 or fill in (AMBER, GREEN, RED) else False, anchor="lm")
            cursor += widths[col_index]


# Board heading
txt((42, 32), "VSM7", 42, ORANGE, black=True)
txt((178, 38), "/ LCARS DESIGN STUDY", 34, INK, True)
txt((1875, 55), "FIVE-SCREEN WORKSHOP INTERFACE CONCEPT · PREVIEW ONLY", 13, MUTED, True, anchor="ra")
d.line((40, 96, 1880, 96), fill="#292730", width=2)

# Main Step II screen
x, y, r, b = screen(40, 120, 1195, 540, "Step II / Primary Screen")
appbar(x, y, r, "TARGET ORGANIZATION WORKSHOP", "SIF / Product Area X", "Completeness 42%")
nav_x, nav_y = x, y + 54
for i, label in enumerate(["Operative Units", "Manageability", "SCTs", "Central / Decentral",
                           "Design S2-S5", "Channels", "Representation"]):
    nav_item(nav_x, nav_y + i * 42, ["I", "II", "III", "IV", "V", "VI", "VII"][i], label, i == 1)
work_x = nav_x + 160
heading(work_x, nav_y, "Step II", "Manageability", 28)
pill(r - 130, nav_y + 7, "Reset sliders", "#292731", 126)

sif_y = nav_y + 56
d.rectangle((work_x, sif_y, r, sif_y + 80), fill="#19181e")
d.rectangle((work_x, sif_y, work_x + 7, sif_y + 80), fill=ORANGE)
txt((work_x + 18, sif_y + 17), "SELECTED SEGMENTATION", 10, PEACH, True)
txt((work_x + 18, sif_y + 38), "PRODUCT PORTFOLIOS", 14, INK, True)
txt((work_x + 18, sif_y + 59), "OPERATIVE UNITS / S1", 9, MUTED)
for i, label in enumerate(["S1-1\nB2C", "S1-2\nB2B", "S1-3\nOEM"]):
    cx = work_x + 255 + i * 82
    d.ellipse((cx, sif_y + 9, cx + 62, sif_y + 71), outline=INK, width=2)
    txt((cx + 31, sif_y + 40), label, 9, INK, True, anchor="mm")

card_y = sif_y + 92
card_w = (r - work_x - 10) / 2
for idx, title in enumerate(["HORIZONTAL VARIETY", "VERTICAL VARIETY"]):
    cx = work_x + idx * (card_w + 10)
    rr((cx, card_y, cx + card_w, card_y + 180), 5, PANEL_2, LINE, 1)
    txt((cx + 12, card_y + 13), title, 11, AMBER, True)
    labels = (["Amount of operative units", "Dissimilarity", "Ability to self-control"]
              if idx == 0 else ["Environmental overlaps", "Operational dependencies", "System 2 coordination"])
    positions = ([.38, .70, .32] if idx == 0 else [.44, .68, .54])
    for j, (label, pos) in enumerate(zip(labels, positions)):
        slider(cx + 12, card_y + 42 + j * 43, label, card_w - 25, pos)

fit_y = card_y + 192
d.rectangle((work_x, fit_y, r, fit_y + 62), fill="#19181e")
d.rectangle((work_x, fit_y, work_x + 7, fit_y + 62), fill=LAVENDER)
txt((work_x + 18, fit_y + 15), "VARIETY FIT", 11, LAVENDER, True)
d.rounded_rectangle((work_x + 125, fit_y + 24, work_x + 460, fit_y + 37), 7, fill=GREEN)
d.rectangle((work_x + 237, fit_y + 24, work_x + 350, fit_y + 37), fill=AMBER)
d.rounded_rectangle((work_x + 350, fit_y + 24, work_x + 460, fit_y + 37), 7, fill=RED)
d.rectangle((work_x + 303, fit_y + 18, work_x + 307, fit_y + 43), fill=INK)
txt((work_x + 480, fit_y + 19), "Horizontal pressure slightly exceeds cohesion capacity.", 9, MUTED)
txt((work_x + 480, fit_y + 36), "Explore stronger coordination or an additional recursion level.", 9, INK, True)

# Start screen
x, y, r, b = screen(1255, 120, 625, 540, "Start / Project Management")
appbar(x, y, r, "WORKSPACE", "", "New Project")
heading(x, y + 55, "Organizations & Projects", "Start", 23)
micro_rail(x, y + 105, r - x)
rows = [("01", "Mobility Systems", "3 active projects"), ("02", "Automotive Interior AG", "Target organization / Step II"),
        ("03", "Product Area X", "Workshop capture / 68%"), ("04", "Shared Services", "VSM from scratch / 21%")]
for i, (n, name, sub) in enumerate(rows):
    ry = y + 132 + i * 62
    d.rectangle((x, ry, r, ry + 53), fill="#1b1a20")
    d.rectangle((x, ry, x + 6, ry + 53), fill=[BLUE, ORANGE, LAVENDER, PEACH][i])
    rr((x + 14, ry + 14, x + 42, ry + 42), 14, [BLUE, ORANGE, LAVENDER, PEACH][i])
    txt((x + 28, ry + 28), n, 8, BG, True, anchor="mm")
    txt((x + 55, ry + 15), name, 11, INK, True)
    txt((x + 55, ry + 34), sub, 8, MUTED)
    txt((r - 18, ry + 26), "✎  ×", 13, PEACH, True, anchor="rm")

# Step I screen
x, y, r, b = screen(40, 680, 600, 360, "Step I / Operative Units")
appbar(x, y, r, "OPERATIVE UNITS", "", "Completeness 86%")
heading(x, y + 53, "System-in-Focus", "Segmentation Evaluation", 19)
for i, label in enumerate(["Regional", "Product", "Customer", "Function"]):
    pill(x + i * 124, y + 102, label, [ORANGE, GREEN, AMBER, RED][i], 116)
matrix_rows = [
    ["CRITERION", "A", "B", "C", "D"],
    ["Customer value", ("3", AMBER), ("1", RED), ("5", GREEN), ("4", AMBER)],
    ["Innovation", ("2", RED), ("5", GREEN), ("3", AMBER), ("4", AMBER)],
    ["Productivity", ("5", GREEN), ("3", AMBER), ("1", RED), ("4", AMBER)],
    ["Market position", ("3", AMBER), ("2", RED), ("5", GREEN), ("4", AMBER)],
]
table(x, y + 145, [180, 70, 70, 70, 70], matrix_rows, 30)

# Step III screen
x, y, r, b = screen(660, 680, 600, 360, "Step III / SCT Register")
appbar(x, y, r, "SUCCESS-CRITICAL TASKS", "", "Focus")
heading(x, y + 53, "Input Signals", "SCT Register", 20)
for i, label in enumerate(["Weak score", "Variety gap", "Manageability lever"]):
    pill(x + i * 150, y + 102, label, [ORANGE, AMBER, LAVENDER][i], 140)
task_rows = [
    ["PRIO", "TASK", "DESCRIPTION", "SOURCE"],
    ["A", "Variant management", "Steer customer-specific variety", "Weak score"],
    ["A", "Resource bargain", "Align scarce capacity across S1 units", "Step II"],
    ["B", "Architecture governance", "Manage shared product dependencies", "Overlap"],
]
table(x, y + 145, [55, 150, 230, 100], task_rows, 38)

# Focus mode screen
x, y, r, b = screen(1280, 680, 600, 360, "Focus Mode / Facilitation")
appbar(x, y, r, "FACILITATION MODE", "", "3 / 7")
copy_x, copy_y = x, y + 56
d.rectangle((copy_x, copy_y, copy_x + 318, b), fill="#15141a")
d.rectangle((copy_x, copy_y, copy_x + 10, b), fill=ORANGE)
txt((copy_x + 24, copy_y + 22), "STEP II / EXPLANATION", 9, ORANGE, True)
txt((copy_x + 24, copy_y + 50), "BALANCE THE", 24, INK, True)
txt((copy_x + 24, copy_y + 78), "REQUIRED VARIETY", 24, INK, True)
txt((copy_x + 24, copy_y + 118), "Judge whether management can absorb the", 9, MUTED)
txt((copy_x + 24, copy_y + 134), "complexity created by the operative units.", 9, MUTED)
for i, prompt in enumerate(["Where does overload appear?", "Which variety can S1 absorb?", "What must management provide?"]):
    txt((copy_x + 24, copy_y + 174 + i * 25), "●", 9, AMBER)
    txt((copy_x + 42, copy_y + 174 + i * 25), prompt, 9, INK)
diagram_left = copy_x + 330
rr((diagram_left, copy_y, r, b), 5, "#101015", LINE, 1)
cx, cy = diagram_left + 115, copy_y + 130
d.ellipse((cx - 82, cy - 82, cx + 82, cy + 82), outline="#5e5869", width=2)
d.ellipse((cx - 32, cy - 32, cx + 32, cy + 32), outline=PEACH, width=3)
txt((cx, cy), "SIF", 11, INK, True, anchor="mm")
for ox, oy, label in [(cx - 35, cy - 105, "S1 VARIETY"), (cx + 63, cy - 13, "S3 CONTROL"),
                       (cx - 35, cy + 78, "S2 COORD."), (cx - 132, cy - 13, "S4 FUTURE")]:
    rr((ox, oy, ox + 70, oy + 28), 14, LAVENDER)
    txt((ox + 35, oy + 14), label, 7, BG, True, anchor="mm")

out = "/Users/mark/Documents/VSM7/design-previews/vsm7-lcars-concept.png"
img.save(out, "PNG", optimize=True)
print(out)
