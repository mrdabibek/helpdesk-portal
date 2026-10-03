"""Generate editable SVG design references and contrast calculations (stdlib)."""
from pathlib import Path
from html import escape
import json

ROOT = Path(__file__).resolve().parents[1]
DEST = ROOT / 'figma_assets'
DEST.mkdir(exist_ok=True)

def rect(x, y, w, h, fill='white', stroke='#E4E8E2', r=10):
    return f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{r}" fill="{fill}" stroke="{stroke}"/>'

def text(x, y, label, size=14, fill='#25352E', weight=500):
    return f'<text x="{x}" y="{y}" font-family="Manrope, Segoe UI, sans-serif" font-size="{size}" fill="{fill}" font-weight="{weight}">{escape(label)}</text>'

def button(x, y, label, fill='#17634D', ink='white', width=220):
    return rect(x,y,width,48,fill,fill,8)+text(x+16,y+30,label,13,ink,700)

parts=[rect(0,0,1200,1400,'#F7F8F4','#F7F8F4',0),text(48,65,'yordam. / Design system',32,'#17634D',800),text(48,100,'Helpdesk murojaatlar portali · Orzuqulov Davlatbek · 03.10.2026',14),text(48,155,'01  RANG VA TIPOGRAFIYA',13,'#66736C',800)]
colors=[('#17634D','Primary'),('#E9F3ED','Mint'),('#25352E','Text'),('#66736C','Muted'),('#B13B32','Overdue'),('#855412','Internal')]
for i,(color,label) in enumerate(colors):
    x=48+i*184
    parts += [rect(x,180,164,70,color,color),text(x,276,label,13,weight=700),text(x,300,color,11,'#66736C')]
parts += [text(48,365,'Har bir murojaat e’tiborda.',29,weight=800),text(48,399,'Manrope 29 / 39 · desktop heading',12,'#66736C'),text(650,365,'Mening murojaatlarim',25,weight=800),text(650,399,'Manrope 25 / 34 · mobile heading',12,'#66736C'),text(48,452,'02  TUGMA HOLATLARI',13,'#66736C',800)]
parts += [button(48,478,'Mijozga yuborish'),button(294,478,'Ikkinchi darajali','#FFFFFF','#17634D'),button(540,478,'Ichki izohni saqlash','#855412'),button(786,478,'Disabled','#92B2A1')]
parts += [button(48,551,'Hover','#104C3B'),rect(288,545,232,60,'none','#17634D',12),button(294,551,'Focus · 3 px / offset 3')]
parts += [text(48,650,'03  HOLAT VA SLA VARIANTLARI',13,'#66736C',800)]
for i,(label,bg,ink) in enumerate([('Yangi','#EAF0FA','#345A99'),('Jarayonda','#F7EFDC','#855412'),('Yechildi','#E8F3EB','#286346'),('Qayta ochilgan','#EFEAFA','#705295'),('Yopilgan','#EDF0ED','#5B675F')]):
    x=48+i*210
    parts += [rect(x,679,190,38,bg,bg,6),text(x+13,704,label,12,ink,700)]
parts += [rect(48,744,370,50,'#F9ECE9','#F9ECE9',8),text(64,774,'⚠ Kechikkan · 1 s 15 daq',14,'#B13B32',700),rect(445,744,370,50,'#F0F5EB','#F0F5EB',8),text(460,774,'◷ 45 daq qoldi',14,'#46623C',700),text(48,850,'04  COMPOSER VARIANTLARI',13,'#66736C',800)]
parts += [rect(48,875,525,260),rect(48,875,525,45,'#F0F6F0','#C8D9CD',10),text(64,903,'Qabul qiluvchi: Azizbek Rahimov · Ommaviy javob',12,'#17634D',700),text(64,957,'Mijozga aniq va tushunarli javob yozing…',13,'#66736C'),button(335,1068,'Javobni ko‘rib chiqish',width=220)]
parts += [rect(600,875,550,260,'#FFF9ED','#DCB56F'),rect(600,875,550,45,'#FFF0D4','#DCB56F',10),text(617,903,'🔒 Faqat jamoa ko‘radi. Mijozga yuborilmaydi.',12,'#855412',700),text(617,957,'Jamoa uchun ichki izoh yozing…',13,'#66736C'),button(912,1068,'Ichki izohni saqlash','#855412',width=220)]
parts += [text(48,1198,'05  HANDOFF',13,'#66736C',800),text(48,1239,'Desktop: 1440 × 1000 · Mobile: 390 × 844 · Breakpoint: 760 px',15),text(48,1275,'Card radius 14 · Input radius 8 · Mobile touch target ≥48 px · Desktop icon ≥40 px',13),text(48,1311,'Public / internal drafts remain separate. Public reply requires recipient + text preview.',13),text(48,1350,'SVG layers are editable; create Auto Layout, components and prototype links in Figma.',12,'#66736C')]
svg='<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="1400" viewBox="0 0 1200 1400">'+''.join(parts)+'</svg>'
(DEST/'yordam-ui-kit.svg').write_text(svg,encoding='utf-8')
(DEST/'ui_kit.svg').write_text(svg,encoding='utf-8')

def luminance(hexcolor):
    rgb=[int(hexcolor[i:i+2],16)/255 for i in (1,3,5)]
    rgb=[v/12.92 if v<=.04045 else ((v+.055)/1.055)**2.4 for v in rgb]
    return sum(a*b for a,b in zip(rgb,[.2126,.7152,.0722]))

pairs=[('primary button','#FFFFFF','#17634D'),('body','#25352E','#FFFFFF'),('muted','#66736C','#FFFFFF'),('internal','#855412','#FFF0D4'),('overdue','#B13B32','#F9ECE9'),('new','#345A99','#EAF0FA'),('reopened','#705295','#EFEAFA')]
ratios=[]
for label,fg,bg in pairs:
    a,b=sorted([luminance(fg),luminance(bg)])
    ratios.append({'label':label,'foreground':fg,'background':bg,'ratio':round((b+.05)/(a+.05),2),'normal_text_4_5':(b+.05)/(a+.05)>=4.5})
(DEST/'contrast.json').write_text(json.dumps(ratios,indent=2),encoding='utf-8')
print('UI kit va kontrast:',[(r['label'],r['ratio']) for r in ratios])

# Reduce detailed text in wireframes to neutral content bars.
import xml.etree.ElementTree as ET
ET.register_namespace('', 'http://www.w3.org/2000/svg')
for file in (DEST/'wireframes').glob('*.svg'):
    tree=ET.parse(file)
    for parent in tree.iter():
        for item in list(parent):
            if item.tag.endswith('}text') and float(item.get('font-size','14'))<=12:
                size=float(item.get('font-size','12'))
                bar=ET.Element('{http://www.w3.org/2000/svg}rect',{
                    'x':item.get('x','0'),'y':str(float(item.get('y','0'))-size*.6),
                    'width':str(min(240,len(item.text or '')*size*.47)),
                    'height':'4','rx':'2','fill':'#D0D0D0'})
                index=list(parent).index(item)
                parent.remove(item)
                parent.insert(index,bar)
    tree.write(file,encoding='utf-8',xml_declaration=True)

cover=[rect(0,0,1440,900,'#F7F8F4','#F7F8F4',0),rect(900,0,540,900,'#17634D','#17634D',0),text(70,90,'yordam.',40,'#17634D',800),text(70,215,'UI / UX CASE STUDY',14,'#66736C',800),text(70,305,'Har bir murojaat',58,weight=800),text(70,385,'e’tiborda.',58,weight=800),text(70,460,'Helpdesk murojaatlar portali',24),text(70,510,'Mijoz muammoni yuboradi. Agent tartiblaydi va javob beradi.',17,'#66736C'),text(70,680,'19 ekran va holat / Mijoz mobil / Agent desktop',18,'#17634D',700),text(70,790,'Orzuqulov Davlatbek · Individual loyiha · 7 kun',15),text(70,823,'3-oktabr 2026',13,'#66736C')]
for y,label,desc in [(260,'01 / Aniqlik','Javob muddati va matnli kechikish'),(415,'02 / Xato oldini olish','Ichki va ommaviy qoralamalar alohida'),(570,'03 / Mijoz nazorati','Yechim tasdig‘i va muammoni qayta ochish')]:
    cover += [text(945,y,label,23,'white',800),text(945,y+45,desc,15,'#D7E8DE')]
(DEST/'cover.svg').write_text('<svg xmlns="http://www.w3.org/2000/svg" width="1440" height="900">'+''.join(cover)+'</svg>',encoding='utf-8')

flow=[rect(0,0,1200,1120,'#F7F8F4','#F7F8F4',0),text(48,64,'Axborot tuzilmasi va foydalanuvchi oqimlari',30,'#17634D',800),text(48,102,'Yordam · Mijoz va agent o‘rtasidagi asosiy qaror nuqtalari',14,'#66736C')]
rows=[('01 / YANGI MUROJAAT',['Mijoz bosh sahifasi','Shakl + ixtiyoriy fayl','Qabul qilindi','Holat va javob muddati']),('02 / ICHKI IZOH',['Agent javobsiz navbati','Ichki izoh rejimi','Faqat jamoaga saqlash','Javobsiz navbatda qoladi']),('03 / OMMAVIY JAVOB',['Agent tafsilot ekrani','Mijozga javob qoralamasi','Matn + mijoz tasdig‘i','Ommaviy yuborish']),('04 / YECHIM VA QAYTA OCHISH',['Agent yechim taklifi','Mijoz tekshiradi','Tasdiqlash → Yopilgan','Muammo qolsa → Qayta ochish'])]
for row,(heading,labels) in enumerate(rows):
    y=175+row*220
    flow += [text(48,y,heading,13,'#66736C',800)]
    for i,label in enumerate(labels):
        x=48+i*283
        flow += [rect(x,y+28,248,92,'white','#D9E3D3'),text(x+16,y+83,label,12,'#25352E',700)]
        if i<3:flow += [f'<path d="M{x+253} {y+74}h20m-6-6 6 6-6 6" fill="none" stroke="#17634D" stroke-width="2"/>']
flow += [text(48,1070,'Qayta ochish: sabab → yangi javob muddati → javobsiz navbat. Ichki izoh mijoz tarixida ko‘rinmaydi.',14,'#17634D',700)]
(DEST/'flows-and-ia.svg').write_text('<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="1120">'+''.join(flow)+'</svg>',encoding='utf-8')
