# ตั้งเครื่องให้ agent ทำงานกับเว็บ drpratchaya

ส่งไฟล์นี้ให้ agent ของคุณอ่าน แล้วให้มันทำตามทีละขั้น ใช้เวลาไม่เกินสิบนาที
เป้าหมายคือให้เครื่องคุณมีโครงเหมือนอีกฝั่ง แล้ว agent สองตัวคุยกันผ่านกระดานเดียวกันได้

---

## จะได้อะไร

```
<โฟลเดอร์ไหนก็ได้>/drpratchaya/
├── drpratchaya/       PUBLIC  · ตัวเว็บ · ต่อ Cloudflare Pages ไว้
│   └── ← เปิดโฟลเดอร์นี้เป็น Cursor workspace
└── drpratchaya-mem/   PRIVATE · กระดานของ agent ไม่ใช่โค้ดเว็บ
```

**ชื่อโฟลเดอร์สองอันนี้ห้ามเปลี่ยน** และต้องเป็นพี่น้องกันในโฟลเดอร์แม่เดียวกัน
เพราะ config ชี้กระดานด้วย path สัมพัทธ์ `../drpratchaya-mem`
ส่วนชื่อโฟลเดอร์แม่จะตั้งเป็นอะไร วางไว้ตรงไหนก็ได้

---

## เรื่องที่ต้องรู้ก่อน — `main` คือเว็บจริง

Cloudflare Pages ต่อกับรีโป `drpratchaya` ไว้ **push เข้า `main` เมื่อไหร่เว็บจริงเปลี่ยนทันที**
ไม่มีขั้นกลาง ไม่มีที่ให้กดยกเลิก

เพราะงั้นห้าม commit บน `main` ตรง ๆ ให้แตก branch แล้วเปิด PR เสมอ แล้วค่อยกด merge
ตอนที่พร้อมให้ขึ้นเว็บจริง — **merge เข้า `main` เท่ากับ deploy**

```sh
git pull --rebase
git switch -c work/<ชื่อคุณ>/<หัวข้อสั้น>
```

อีกข้อ รีโป `drpratchaya` เป็น public ของในนั้นคนทั้งโลกอ่านได้ และ Cloudflare
เสิร์ฟไฟล์จากรากรีโป **ห้ามใส่ข้อมูลคนไข้ ข้อมูลส่วนตัว คีย์ หรือรหัสอะไรลงไปเด็ดขาด**
บันทึกภายในให้ไปอยู่ `drpratchaya-mem` ซึ่งเป็น private

---

## ของที่ต้องมีบนเครื่อง

- `git` · `python3` เวอร์ชัน 3.10 ขึ้นไป · Cursor
- สิทธิ์เข้ารีโป `swisspra/drpratchaya-mem` — ต้องถูก add เป็น collaborator ก่อน
  ถ้า clone แล้วขึ้น 404 แปลว่ายังไม่ได้สิทธิ์ ให้ทักไปขอ

---

## ขั้นที่ 1 — ลง On Board MCP server

เป็นตัวที่ทำให้ agent จำงานข้ามรอบคุยได้ และแชร์กระดานกับอีกฝั่ง เป็น repo สาธารณะ

```sh
git clone https://github.com/swisspra/On_Board.git ~/On_Board-local
echo 'export ONBOARD_HOME="$HOME/On_Board-local"' >> ~/.zshrc
```

ถ้าใช้ bash ให้เปลี่ยน `~/.zshrc` เป็น `~/.bashrc`
จะวางไว้ที่อื่นก็ได้ แค่ให้ `ONBOARD_HOME` ชี้ถูกที่

ตรวจ — ต้องเห็น path และคำว่าเจอไฟล์

```sh
zsh -ilc 'echo $ONBOARD_HOME; test -f "$ONBOARD_HOME/onboard_server.py" && echo เจอแล้ว'
```

ต้องใช้ `zsh -ilc` ไม่ใช่ `zsh -lc` เพราะ `.zshrc` ถูกอ่านเฉพาะ shell แบบ interactive
ถ้าค่าว่างให้เปิด terminal ใหม่แล้วลองอีกครั้ง

**ห้ามรัน `setup-project.sh` ที่อยู่ในนั้น** มันจะเติม `.agent-mem/` กับไฟล์กติกา
ลง `.gitignore` ให้เอง ซึ่งคือของที่เราตั้งใจเก็บเข้า git กระดานจะหลุดหายแบบไม่มีใครรู้
config ที่ต้องใช้มีอยู่ในรีโปแล้ว ไม่ต้องรันอะไรเพิ่ม

## ขั้นที่ 2 — clone สองรีโป

```sh
mkdir -p ~/Project/drpratchaya && cd ~/Project/drpratchaya
git clone https://github.com/pratchayam-collab/drpratchaya.git drpratchaya
git clone https://github.com/swisspra/drpratchaya-mem.git drpratchaya-mem
```

ตรวจว่าได้ครบ

```sh
ls          # ต้องเห็นสองโฟลเดอร์ ชื่อตรงตามนี้เป๊ะ
git -C drpratchaya ls-files | head
```

## ขั้นที่ 3 — ติดตั้ง merge driver ของกระดาน

ข้อนี้ห้ามข้าม ถ้าไม่ทำ แล้วสองคนเขียนกระดานพร้อมกัน git จะให้เลือกข้างเดียว
งานของอีกฝั่งจะหายไปทั้งก้อนโดยไม่มีอะไรเตือน

```sh
cd drpratchaya-mem
python3 scripts/merge_agent_mem.py --install
```

ตรวจ — ต้องได้บรรทัดคำสั่งกลับมา ถ้าว่างคือยังไม่ติด

```sh
git config --get merge.agent-mem.driver
```

## ขั้นที่ 4 — เปิด Cursor แล้วต่อ MCP

เปิด Cursor ที่โฟลเดอร์ **`drpratchaya`** (ตัวเว็บ) ไม่ใช่โฟลเดอร์แม่
Cursor อ่าน config จาก workspace root เท่านั้น ไม่ไล่ลงไปหาในโฟลเดอร์ลูก

config อยู่ในรีโปมาให้แล้วที่ `.cursor/mcp.json` ไม่ต้องสร้างเอง
แต่ต้อง **restart Cursor หนึ่งครั้ง** หลัง clone เสร็จ ไม่งั้นมันยังไม่โหลด

ตรวจ — ใน Cursor ให้เรียกสองอย่างนี้ตามลำดับ

1. `memory_onboard`
2. `memory_doctor` — ต้องบอกว่าต่อติด

ถ้าไม่เห็น MCP ชื่อ `agent-memory` เลย ให้เปิด Output panel เลือก MCP Logs อ่านว่าค้างตรงไหน
สาเหตุที่เจอบ่อยที่สุดคือ `ONBOARD_HOME` ยังไม่มีค่าตอน Cursor เปิด — ตั้งค่าแล้วต้อง restart

---

## ทำงานร่วมกันยังไงไม่ให้ชนกัน

ทั้งสองฝั่งใช้กระดานเดียวกัน ลำดับนี้คือสิ่งที่กันไม่ให้ทำงานทับกัน

1. **`git pull --rebase` ก่อน `memory_onboard` ทุกครั้ง** ไม่มีข้อยกเว้น
   ไม่ pull ก่อน = ทำงานบนกระดานเวอร์ชันเก่า แล้ว push ทับงานอีกฝั่ง
2. **จองงานด้วย `memory_claim_ticket` ก่อนลงมือเสมอ** ไม่ใช่ประกาศไว้เฉย ๆ
   ใบที่ `claimed_by` ไม่ใช่ชื่อคุณ ห้ามแตะ
3. **`memory_handoff` เสร็จแล้ว push ทันที** ยิ่งค้างในเครื่องนาน โอกาสชนยิ่งสูง
4. `memory_wait_for_event` ตื่นจากไฟล์ในเครื่องตัวเองเท่านั้น คนละเครื่องปลุกกันไม่ได้
   ต้องนัดจังหวะ pull กันเอง

กติกาของตัวเว็บอยู่ใน `drpratchaya/AGENTS.md` (เนื้อเดียวกับ `CLAUDE.md` และ `.cursorrules`)
agent จะอ่านเองเมื่อเปิดโฟลเดอร์นั้นเป็น workspace ฉบับล่าสุดได้จาก `git pull` เสมอ

---

## สรุปคำสั่งตรวจตอนจบ

```sh
cd ~/Project/drpratchaya
git -C drpratchaya branch --show-current          # ควรเป็น main ตอนเพิ่ง clone
git -C drpratchaya-mem config --get merge.agent-mem.driver   # ต้องไม่ว่าง
zsh -ilc 'test -f "$ONBOARD_HOME/onboard_server.py" && echo On Board พร้อม'
```

ครบสามข้อแล้วเรียก `memory_doctor` ใน Cursor ถ้าผ่านคือใช้ได้

จำข้อเดียวให้ได้ถ้าจะจำแค่ข้อเดียว — **merge เข้า `main` เท่ากับเว็บจริงเปลี่ยนทันที**
