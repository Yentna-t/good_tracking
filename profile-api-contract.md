# Health Profile API Contract

## 1. Purpose

เอกสารนี้กำหนดข้อตกลงระหว่าง Frontend และ Backend สำหรับฟีเจอร์ Health Profile Setup

Frontend และ Backend ต้องใช้:

* Endpoint เดียวกัน
* HTTP Method เดียวกัน
* ชื่อ Field เดียวกัน
* Enum values เดียวกัน
* รูปแบบ Request และ Response เดียวกัน

ห้ามฝ่ายใดฝ่ายหนึ่งเปลี่ยน Contract โดยไม่แจ้งและ Review ร่วมกัน

---

## 2. Feature Scope

ระบบต้องรองรับข้อมูลต่อไปนี้:

* อายุ
* ส่วนสูง
* น้ำหนัก
* เป้าหมายสุขภาพ
* ระดับกิจกรรม
* รูปแบบอาหาร
* อาหารที่แพ้
* อาหารที่หลีกเลี่ยงหรือไม่กิน

ระบบยังไม่มี Login ดังนั้นจะมี Health Profile เพียงหนึ่งรายการ

---

## 3. Base URL

Development Backend:

```text
http://localhost:8000
```

API Base URL:

```text
http://localhost:8000/api
```

Frontend Development URL:

```text
http://localhost:5173
```

---

## 4. Profile Data Model

```json
{
  "age": 22,
  "height_cm": 170,
  "weight_kg": 72.5,
  "goal": "lose_weight",
  "activity_level": "moderate",
  "diet_type": "balanced",
  "allergies": [
    "peanut",
    "shrimp"
  ],
  "avoided_foods": [
    "pork",
    "milk"
  ]
}
```

---

## 5. Field Definitions

| Field            | Type             | Required | Description                  |
| ---------------- | ---------------- | -------: | ---------------------------- |
| `age`            | Integer          |      Yes | อายุของผู้ใช้                |
| `height_cm`      | Number           |      Yes | ส่วนสูงหน่วยเซนติเมตร        |
| `weight_kg`      | Number           |      Yes | น้ำหนักหน่วยกิโลกรัม         |
| `goal`           | String           |      Yes | เป้าหมายสุขภาพ               |
| `activity_level` | String           |      Yes | ระดับกิจกรรมประจำวัน         |
| `diet_type`      | String           |      Yes | รูปแบบอาหาร                  |
| `allergies`      | Array of strings |      Yes | อาหารที่แพ้                  |
| `avoided_foods`  | Array of strings |      Yes | อาหารที่ไม่กินหรือหลีกเลี่ยง |

ถ้าผู้ใช้ไม่มีอาหารที่แพ้หรือหลีกเลี่ยง ให้ส่ง Array ว่าง:

```json
{
  "allergies": [],
  "avoided_foods": []
}
```

ห้ามส่ง:

```json
{
  "allergies": null,
  "avoided_foods": null
}
```

---

## 6. Validation Rules

| Field            | Validation                                |
| ---------------- | ----------------------------------------- |
| `age`            | ต้องเป็น Integer ระหว่าง 13–100           |
| `height_cm`      | ต้องเป็น Number ระหว่าง 100–250           |
| `weight_kg`      | ต้องเป็น Number ระหว่าง 30–300            |
| `goal`           | ต้องเป็นค่าที่กำหนดใน Goal Enum           |
| `activity_level` | ต้องเป็นค่าที่กำหนดใน Activity Level Enum |
| `diet_type`      | ต้องเป็นค่าที่กำหนดใน Diet Type Enum      |
| `allergies`      | ต้องเป็น Array ของ String                 |
| `avoided_foods`  | ต้องเป็น Array ของ String                 |

Backend เป็นผู้ตรวจสอบข้อมูลขั้นสุดท้าย แม้ Frontend จะมี Validation แล้วก็ตาม

---

## 7. Goal Enum

ค่าที่ API รับ:

```text
lose_weight
maintain_weight
gain_weight
gain_muscle
```

| API Value         | UI Label        |
| ----------------- | --------------- |
| `lose_weight`     | ลดน้ำหนัก       |
| `maintain_weight` | รักษาน้ำหนัก    |
| `gain_weight`     | เพิ่มน้ำหนัก    |
| `gain_muscle`     | เพิ่มกล้ามเนื้อ |

Frontend ต้องส่ง API Value ไม่ใช่ข้อความที่แสดงใน UI

ถูกต้อง:

```json
{
  "goal": "lose_weight"
}
```

ไม่ถูกต้อง:

```json
{
  "goal": "ลดน้ำหนัก"
}
```

---

## 8. Activity Level Enum

ค่าที่ API รับ:

```text
sedentary
light
moderate
active
very_active
```

| API Value     | UI Label             | Description                     |
| ------------- | -------------------- | ------------------------------- |
| `sedentary`   | ไม่ค่อยออกกำลังกาย   | ทำงานนั่งเป็นส่วนใหญ่           |
| `light`       | ออกกำลังกายเล็กน้อย  | ประมาณ 1–2 วันต่อสัปดาห์        |
| `moderate`    | ออกกำลังกายปานกลาง   | ประมาณ 3–5 วันต่อสัปดาห์        |
| `active`      | ออกกำลังกายเป็นประจำ | ประมาณ 6–7 วันต่อสัปดาห์        |
| `very_active` | ออกกำลังกายหนักมาก   | ออกกำลังกายหนักหรือใช้แรงงานมาก |

---

## 9. Diet Type Enum

ค่าที่ API รับ:

```text
balanced
vegetarian
vegan
keto
halal
other
```

| API Value    | UI Label            |
| ------------ | ------------------- |
| `balanced`   | อาหารทั่วไปแบบสมดุล |
| `vegetarian` | มังสวิรัติ          |
| `vegan`      | วีแกน               |
| `keto`       | คีโต                |
| `halal`      | ฮาลาล               |
| `other`      | รูปแบบอื่น          |

---

# 10. GET `/api/profile`

## Purpose

ดึง Health Profile ปัจจุบัน

## Request

```http
GET /api/profile
```

ไม่มี Request Body

---

## Success Response

Status:

```http
200 OK
```

Body:

```json
{
  "age": 22,
  "height_cm": 170,
  "weight_kg": 72.5,
  "goal": "lose_weight",
  "activity_level": "moderate",
  "diet_type": "balanced",
  "allergies": [
    "peanut",
    "shrimp"
  ],
  "avoided_foods": [
    "pork"
  ]
}
```

Frontend Behavior:

* นำข้อมูลเติมลงใน Form
* ผู้ใช้สามารถแก้ไขและบันทึกใหม่ได้

---

## Profile Not Found

กรณียังไม่มี Health Profile

Status:

```http
404 Not Found
```

Body:

```json
{
  "detail": "Profile has not been created"
}
```

Frontend Behavior:

* ไม่ถือว่าเป็น System Error
* แสดง Form ว่าง
* ให้ผู้ใช้สร้าง Profile ใหม่

---

## Server Error

Status:

```http
500 Internal Server Error
```

ตัวอย่าง Body:

```json
{
  "detail": "Unable to retrieve profile"
}
```

Frontend Behavior:

* แสดงข้อความว่าไม่สามารถโหลดข้อมูลได้
* แสดงปุ่ม Retry หากมี

---

# 11. PUT `/api/profile`

## Purpose

สร้าง Health Profile ใหม่หรือแทนที่ Profile ปัจจุบัน

## Request

```http
PUT /api/profile
Content-Type: application/json
```

Body:

```json
{
  "age": 22,
  "height_cm": 170,
  "weight_kg": 72.5,
  "goal": "lose_weight",
  "activity_level": "moderate",
  "diet_type": "balanced",
  "allergies": [
    "peanut",
    "shrimp"
  ],
  "avoided_foods": [
    "pork",
    "milk"
  ]
}
```

---

## Success Response

Status:

```http
200 OK
```

Body:

```json
{
  "age": 22,
  "height_cm": 170,
  "weight_kg": 72.5,
  "goal": "lose_weight",
  "activity_level": "moderate",
  "diet_type": "balanced",
  "allergies": [
    "peanut",
    "shrimp"
  ],
  "avoided_foods": [
    "pork",
    "milk"
  ]
}
```

Frontend Behavior:

* หยุดสถานะ Saving
* แสดงข้อความ `บันทึกข้อมูลสำเร็จ`
* ใช้ Response จาก Backend เป็นข้อมูลล่าสุดใน Form

---

## Validation Error

กรณี Request Body ไม่ถูกต้อง

Status:

```http
422 Unprocessable Entity
```

ตัวอย่างกรณีอายุต่ำกว่ากำหนด:

```json
{
  "detail": [
    {
      "type": "greater_than_equal",
      "loc": [
        "body",
        "age"
      ],
      "msg": "Input should be greater than or equal to 13",
      "input": 10,
      "ctx": {
        "ge": 13
      }
    }
  ]
}
```

Frontend Behavior:

* อ่าน Field จาก `loc`
* แสดง Error ใกล้ Input ที่เกี่ยวข้อง
* ไม่ล้างข้อมูลที่ผู้ใช้กรอกไว้

---

## Example Invalid Goal

Request:

```json
{
  "age": 22,
  "height_cm": 170,
  "weight_kg": 72.5,
  "goal": "be_healthy",
  "activity_level": "moderate",
  "diet_type": "balanced",
  "allergies": [],
  "avoided_foods": []
}
```

Response:

```http
422 Unprocessable Entity
```

เพราะ `be_healthy` ไม่ใช่ค่าที่อยู่ใน Goal Enum

---

# 12. Frontend TypeScript Contract

Frontend ควรสร้าง Type ตามนี้:

```typescript
export type HealthGoal =
  | "lose_weight"
  | "maintain_weight"
  | "gain_weight"
  | "gain_muscle";

export type ActivityLevel =
  | "sedentary"
  | "light"
  | "moderate"
  | "active"
  | "very_active";

export type DietType =
  | "balanced"
  | "vegetarian"
  | "vegan"
  | "keto"
  | "halal"
  | "other";

export interface HealthProfile {
  age: number;
  height_cm: number;
  weight_kg: number;
  goal: HealthGoal;
  activity_level: ActivityLevel;
  diet_type: DietType;
  allergies: string[];
  avoided_foods: string[];
}
```

Frontend ห้ามเปลี่ยน Field เป็น Camel Case เช่น:

```typescript
heightCm
weightKg
activityLevel
```

เพราะ Backend Contract ใช้:

```text
height_cm
weight_kg
activity_level
```

---

# 13. Backend Pydantic Contract

Backend ควรสร้าง Schema ตามนี้:

```python
from typing import Literal

from pydantic import BaseModel, Field


HealthGoal = Literal[
    "lose_weight",
    "maintain_weight",
    "gain_weight",
    "gain_muscle",
]

ActivityLevel = Literal[
    "sedentary",
    "light",
    "moderate",
    "active",
    "very_active",
]

DietType = Literal[
    "balanced",
    "vegetarian",
    "vegan",
    "keto",
    "halal",
    "other",
]


class HealthProfile(BaseModel):
    age: int = Field(ge=13, le=100)
    height_cm: float = Field(ge=100, le=250)
    weight_kg: float = Field(ge=30, le=300)

    goal: HealthGoal
    activity_level: ActivityLevel
    diet_type: DietType

    allergies: list[str] = Field(default_factory=list)
    avoided_foods: list[str] = Field(default_factory=list)
```

---

# 14. CORS Contract

Backend ต้องอนุญาต Frontend Development URL:

```text
http://localhost:5173
```

FastAPI Configuration:

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

---

# 15. Environment Variables

Frontend `.env`:

```env
VITE_API_URL=http://localhost:8000
```

Frontend ต้องเรียก URL ผ่าน:

```typescript
const API_URL = import.meta.env.VITE_API_URL;
```

ห้ามเขียน Backend URL กระจายในหลายไฟล์

---

# 16. Frontend API Examples

## Get Profile

```typescript
export async function getProfile(): Promise<HealthProfile | null> {
  const response = await fetch(
    `${import.meta.env.VITE_API_URL}/api/profile`,
  );

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    throw new Error("Unable to load profile");
  }

  return response.json();
}
```

## Save Profile

```typescript
export async function saveProfile(
  profile: HealthProfile,
): Promise<HealthProfile> {
  const response = await fetch(
    `${import.meta.env.VITE_API_URL}/api/profile`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(profile),
    },
  );

  if (!response.ok) {
    throw new Error("Unable to save profile");
  }

  return response.json();
}
```

---

# 17. Manual Integration Test

## Test 1: No Profile

1. เปิด Backend
2. ยังไม่สร้าง Profile
3. Frontend เรียก `GET /api/profile`
4. Backend ต้องตอบ `404`
5. Frontend ต้องแสดง Form ว่าง

---

## Test 2: Create Profile

1. ผู้ใช้กรอกข้อมูลครบ
2. Frontend ส่ง `PUT /api/profile`
3. Backend ต้องตอบ `200`
4. Frontend แสดงข้อความบันทึกสำเร็จ

---

## Test 3: Load Existing Profile

1. Refresh หน้า
2. Frontend เรียก `GET /api/profile`
3. Backend ตอบ Profile ล่าสุด
4. Frontend เติมข้อมูลลง Form

---

## Test 4: Update Profile

1. เปลี่ยนน้ำหนักจาก `72.5` เป็น `71.8`
2. Frontend ส่ง `PUT /api/profile`
3. Backend แทนที่ Profile เดิม
4. Frontend แสดงข้อมูลใหม่

---

## Test 5: Invalid Age

ส่ง:

```json
{
  "age": 10,
  "height_cm": 170,
  "weight_kg": 72.5,
  "goal": "lose_weight",
  "activity_level": "moderate",
  "diet_type": "balanced",
  "allergies": [],
  "avoided_foods": []
}
```

Expected:

```http
422 Unprocessable Entity
```

---

# 18. Change Management

หากต้องการเปลี่ยน Contract เช่น:

* เพิ่ม Field ใหม่
* เปลี่ยนชื่อ Field
* เพิ่ม Enum Value
* เปลี่ยน Endpoint
* เปลี่ยน Response Format

ต้องทำตามขั้นตอน:

```text
สร้าง GitHub Issue
        ↓
แก้ docs/profile-api-contract.md
        ↓
Frontend และ Backend Review
        ↓
Merge Contract เข้า main
        ↓
แต่ละฝ่ายอัปเดต Branch ของตัวเอง
```

ห้ามเปลี่ยน Contract เฉพาะใน Frontend หรือ Backend ฝ่ายเดียว

---

# 19. Out of Scope

Contract เวอร์ชันนี้ยังไม่รองรับ:

* Login
* User ID
* Profile หลายรายการ
* Authentication Token
* Database ID
* Created date
* Updated date
* BMR
* TDEE
* Recommended calories
* Macro calculation
* AI recommendation

---

# 20. Contract Checklist

ก่อนเปิด Pull Request ให้ตรวจว่า:

* [ ] Endpoint ตรงกัน
* [ ] HTTP Method ตรงกัน
* [ ] ชื่อ Field ตรงกัน
* [ ] Enum values ตรงกัน
* [ ] Numeric ranges ตรงกัน
* [ ] Arrays ไม่ส่งเป็น `null`
* [ ] Frontend ใช้ `VITE_API_URL`
* [ ] Backend เปิด CORS ให้ Port 5173
* [ ] GET รองรับ `200` และ `404`
* [ ] PUT รองรับ `200` และ `422`
* [ ] Frontend TypeScript type ตรงกับ Pydantic schema
* [ ] Frontend และ Backend ทดสอบร่วมกันแล้ว
