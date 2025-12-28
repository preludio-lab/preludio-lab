# Database Capacity Estimation

**Objective:** Validate that 70,000 articles can fit within **Supabase Free Tier (500 MB)**.

## 1. Conclusion: Strategy for 500MB
To manage 70k articles within 500MB, the following strategies are **mandatory**:

1.  **Split-Storage:** Move Article Body (MDX) to Object Storage (R2).
2.  **Half-Precision:** Use `halfvec` (16-bit) for Vector Embeddings.
3.  **Summary Only:** Index `summary` for search, not the full body.

**Result:** Estimated Total Usage = **~370 MB** (✅ Safe)

---

## 2. Detailed Breakdown

### 2.1 Table Data (Rows)
MDX bodies are excluded. Only Metadata, Scores, and Summaries are stored.

| Item | Per Row | 70k Total | Note |
| :--- | :--- | :--- | :--- |
| **Metadata** | 0.2 KB | 14 MB | ID(UUID), Slug, Titles |
| **Summary** | 1.0 KB | 70 MB | For Search & Listing |
| **Scores** | 0.5 KB | 35 MB | ABC/MusicXML (Text) |
| **Content Body** | - | **0 MB** | **Offloaded to R2** |
| **Table Total** | | **119 MB** | |

### 2.2 vector (Embeddings)
Standard `float32` vectors exceed the limit. `halfvec` is required.

| Type | Size per Row | Data Total | Index (HNSW) | Total Impact |
| :--- | :--- | :--- | :--- | :--- |
| **Float32** | 3 KB | 210 MB | ~210 MB | **420 MB** (❌ Fatal) |
| **Halfvec** | 1.5 KB | **105 MB** | **~100 MB** | **205 MB** (✅ Safe) |

### 2.3 Total Capacity Usage
| Category | Size |
| :--- | :--- |
| **Table Data** | 119 MB |
| **Standard Indexes** (B-Tree/GIN) | 45 MB |
| **Vector Data + Index** (`halfvec`) | 205 MB |
| **Grand Total** | **369 MB** |

## 3. ID Strategy (UUID vs Integer)
**Decision: Use UUID.**
Difference is negligible: `16 bytes` vs `4 bytes` * 70k = **~0.8 MB diff**.
Prioritize randomness and security over micro-optimization.
