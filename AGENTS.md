# drpratchaya — เว็บให้ความรู้ออร์โธปิดิกส์

เว็บ static HTML ล้วน ไม่มี build step ไม่มี framework แก้ไฟล์แล้วคือผลลัพธ์เลย

## โครง

```
drpratchaya/        ← รีโปนี้ · PUBLIC · pratchayam-collab/drpratchaya
drpratchaya-mem/    ← รีโปข้าง ๆ · PRIVATE · กระดาน On Board อยู่ที่นั่น ไม่ใช่ที่นี่
```

หน้าเว็บที่มีตอนนี้ — `index.html` `acl.html` `patellofemoral.html`
`rotator-cuff.html` `shoulder-dislocation.html`

## กติกาที่ห้ามพลาด

1. **`main` คือเว็บจริง** Cloudflare Pages ต่อกับรีโปนี้ไว้ push เข้า `main` แล้วขึ้น production ทันที
   ห้าม commit บน `main` ตรง ๆ แตก branch แล้วเปิด PR ให้เจ้าของเว็บกด merge

   ```sh
   git pull --rebase
   git switch -c work/<ชื่อคุณ>/<หัวข้อสั้น>
   ```

2. **pull ก่อนเริ่มเสมอ** สองคนทำงานร่วมกันอยู่ ไม่ pull ก่อนจะทับงานอีกฝ่าย

3. **ห้าม `git commit -a`** เติมทีละไฟล์ที่ตั้งใจ ก่อน push ให้ `git status` อ่านให้ครบ
   เจอไฟล์ที่ไม่ใช่ของคุณอย่ารวมเข้าไป

4. **ของในรีโปนี้ออกสู่สาธารณะหมด** Cloudflare เสิร์ฟไฟล์จากรากรีโป
   ห้ามใส่ข้อมูลคนไข้ ข้อมูลส่วนตัว คีย์ หรือ token ลงที่นี่เด็ดขาด
   บันทึกภายในให้ไปอยู่ `drpratchaya-mem`

5. **เนื้อหาการแพทย์ต้องให้เจ้าของเว็บตรวจก่อน** agent แก้ถ้อยคำหรือโครงหน้าได้
   แต่ห้ามแต่งข้อเท็จจริงทางการแพทย์เพิ่มเอง ถ้าไม่มีต้นทางให้ถามก่อน

## กระดานงาน

กระดานอยู่ที่ `../drpratchaya-mem` ไม่ใช่รีโปนี้ ต่อผ่าน MCP `agent-memory`
เริ่มงานให้ `memory_onboard` ก่อน แล้วจองงานด้วย `memory_claim_ticket` ทุกครั้งก่อนลงมือ
ใบที่ `claimed_by` ไม่ใช่ชื่อคุณ ห้ามแตะ — นี่คือสิ่งเดียวที่กันสองคนทำงานชนกัน

`.agent-mem/` ถูก track และ push ขึ้นรีโปส่วนตัว **pull ก่อน `memory_onboard` เสมอ**
และ push ทันทีหลัง `memory_handoff` ยิ่งค้างในเครื่องนาน โอกาสชนยิ่งสูง

## ห้ามรัน `setup-project.sh` ของ On Board กับสองรีโปนี้

มันเติม `.agent-mem/` `CLAUDE.md` `AGENTS.md` `.cursorrules` ลง `.gitignore` ให้เอง
ซึ่งคือของที่เรา track ไว้ กระดานจะหลุดออกจาก git แบบไม่มีสัญญาณอะไรเลย
ถ้าเผลอรันไป ให้ไปถอนบรรทัดที่มันเติมใน `.gitignore` ออก
