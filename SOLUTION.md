# Solution: SyncFlow CTF Challenge

## Challenge Variants

This CTF challenge has **THREE different game modes**, each with unique characteristics and exploitation strategies:

| Variant | Dealing Mode | Deck Type | Difficulty | Key Exploit |
|---------|--------------|-----------|------------|-------------|
| **Variant 1** | Predictable | Decimal (1-100) | Easy-Medium | Card pattern prediction + bot timing |
| **Variant 2** | Normal | Decimal (1-100) | Medium | Bot timing only |
| **Variant 3** | Normal | Hexadecimal (01-30) | Medium-Hard | Bot timing + hex conversion |

---

## Step 1: Identify Your Variant

**Start a single-player game and check your cards:**

1. **See hex cards** (0A, 1F, 2D)? → **Variant 3** (skip to Variant 3 solution)
2. **See decimal cards** (1-100)?
   - Play level 1 multiple times
   - Get the **same starting card** every time? → **Variant 1**
   - Get **random cards**? → **Variant 2**

---

## Step 2: Universal Bot Timing Exploit

**All variants use the same bot timing formula:**

```
Bot Delay (seconds) = (Bot's Card Value - Last Card Value)
```

**How to use:**
1. Note the last played card value
2. Count how many seconds the bot waits
3. Calculate: Bot's card = Last card + Wait time

**Example:**
- Last card: 15
- Bot waits 8 seconds
- Bot played: 15 + 8 = 23

**Important for Variant 3:** Bot uses **decimal values** even with hex cards!

---

## 🎯 VARIANT 1 SOLUTION: Predictable + Decimal

### How It Works
Cards are dealt in a predictable pattern:
- The game selects cards randomly, then **sorts them** lowest to highest
- **You get cards at positions**: 0, 2, 4, 6, 8... (even indices)
- **Bot gets cards at positions**: 1, 3, 5, 7, 9... (odd indices)

### Step-by-Step Solution

**Step 1: Understand the Pattern**
```
Level 3 example (6 cards total):
Your hand: [12, 34, 67]

The sorted pool is: [12, BOT1, 34, BOT2, 67, BOT3]
Bot's cards are BETWEEN yours!
```

**Step 2: Deduce Bot's Cards**
- Bot's first card is between your 1st and 2nd card
- Bot's second card is between your 2nd and 3rd card
- Bot's last card is higher than your last card

---

## 🎯 VARIANT 2 SOLUTION: Normal + Decimal

### How It Works
- Cards are dealt **randomly** (no pattern)
- You can only deduce bot's cards through **timing**

### Step-by-Step Solution

**Step 1: Timing Analysis**
1. After any card is played, watch bot carefully
2. Count the seconds before bot plays
3. Calculate: Bot's card = Last card + Delay seconds

**Step 2: Card Tracking**
Keep mental notes:
- Which cards have been played
- Bot's remaining card count
- Possible ranges for bot's cards

---

## 🎯 VARIANT 3 SOLUTION: Normal + Hex

### How It Works
- Cards shown in **hexadecimal** (01, 0A, 1F, 2D, etc.)
- Bot timing uses **decimal values internally**
- You must convert hex ↔ decimal constantly

### Hex Reference Table
```
00-09: 0-9 (same)
0A-0F: 10-15
10-19: 16-25
1A-1F: 26-31
20-29: 32-41
2A-2F: 42-47
30: 48 (max)

Quick conversions:
0A=10, 0F=15, 1A=26, 1F=31, 2A=42, 2F=47, 30=48
```

### Step-by-Step Solution

**Step 1: Convert Your Hand to Decimal**
```
Your hand shows: [0C, 1F, 2A]
Convert mentally:  [12, 31, 42]
THINK IN DECIMAL for all timing!
```

**Step 2: Bot Timing with Decimal Math**
```
Last played: 0A (decimal 10)
Bot waits 8 seconds
Bot played: 10 + 8 = 18 decimal = 12 hex
```

**Step 3: Quick Conversion Tricks**
- **0x**: Just use the number (09 = 9)
- **1x**: Add 16 (1A = 16+10 = 26)
- **2x**: Add 32 (2F = 32+15 = 47)
- **For A-F**: A=10, B=11, C=12, D=13, E=14, F=15

**Step 4: Use Browser Console**
```javascript
// In browser console (F12):
parseInt('1F', 16)  // Converts 1F → 31
(31).toString(16)   // Converts 31 → "1f"
```

**Step 5: Play Carefully**
1. Convert all your cards to decimal at start of level
2. When bot plays, count delay in seconds
3. Calculate bot's decimal value
4. Convert back to hex to verify