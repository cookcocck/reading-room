import json, os

data_dir = "C:/Users/huang/AppData/Local/Temp"
out_dir = "C:/Users/huang/WorkBuddy/2026-06-06-14-24-59/reading-site/src/data"

os.makedirs(out_dir, exist_ok=True)

# 1. Shelf
with open(f"{data_dir}/we_read_shelf.json", encoding="utf-8") as f:
    shelf = json.load(f)

# 2. Annual 
with open(f"{data_dir}/we_read_annual.json", encoding="utf-8") as f:
    annual = json.load(f)

# 3. Overall
with open(f"{data_dir}/we_read_overall.json", encoding="utf-8") as f:
    overall = json.load(f)

# 4. Notebooks
with open(f"{data_dir}/we_read_notebooks.json", encoding="utf-8") as f:
    notebooks = json.load(f)

print(f"Shelf books: {len(shelf.get('books', []))}, albums: {len(shelf.get('albums', []))}")
print(f"Notebooks totalBookCount: {notebooks.get('totalBookCount', 0)}, totalNoteCount: {notebooks.get('totalNoteCount', 0)}")

# ─── Extract shelf books ───
books_data = []
for b in shelf.get("books", []):
    books_data.append({
        "id": b.get("bookId", ""),
        "title": b.get("title", ""),
        "author": b.get("author", ""),
        "cover": b.get("cover", ""),
        "category": b.get("category", ""),
        "finished": b.get("finishReading", 0) == 1,
        "updateTime": b.get("readUpdateTime", 0),
    })
# Sort by most recently read
books_data.sort(key=lambda x: x["updateTime"], reverse=True)

# ─── Extract annual stats ───
annual_data = {}
read_stat = annual.get("readStat", [])
for s in read_stat:
    annual_data[s.get("stat", "")] = s.get("counts", "")

annual_data["totalReadTimeSec"] = annual.get("totalReadTime", 0)
annual_data["readDays"] = annual.get("readDays", 0)
annual_data["dayAvgReadTimeSec"] = annual.get("dayAverageReadTime", 0)

# prefer authors
prefer_authors = []
for a in annual.get("preferAuthor", []):
    prefer_authors.append({
        "name": a.get("name", ""),
        "count": a.get("count", 0),
        "readTime": a.get("readTime", ""),
    })
annual_data["preferAuthors"] = prefer_authors

# prefer categories
prefer_cats = []
for c in annual.get("preferCategory", []):
    prefer_cats.append({
        "title": c.get("categoryTitle", ""),
        "time": c.get("readingTime", 0),
        "count": c.get("readingCount", 0),
    })
annual_data["preferCategories"] = prefer_cats

# read longest books
top_books = []
for r in annual.get("readLongest", []):
    b = r.get("book", {})
    top_books.append({
        "title": b.get("title", ""),
        "author": b.get("author", ""),
        "cover": b.get("cover", ""),
        "readTime": r.get("readTime", 0),
        "tags": r.get("tags", []),
    })
annual_data["topBooks"] = top_books[:15]

# ─── Extract overall stats ───
overall_data = {}
read_stat2 = overall.get("readStat", [])
for s in read_stat2:
    overall_data[s.get("stat", "")] = s.get("counts", "")

overall_data["totalReadTimeSec"] = overall.get("totalReadTime", 0)
overall_data["readDays"] = overall.get("readDays", 0)
overall_data["registTime"] = overall.get("registTime", 0)

# prefer authors from overall
overall_authors = []
for a in overall.get("preferAuthor", []):
    overall_authors.append({
        "name": a.get("name", ""),
        "count": a.get("count", 0),
        "readTime": a.get("readTime", ""),
    })
overall_data["preferAuthors"] = overall_authors

# prefer categories from overall
overall_cats = []
for c in overall.get("preferCategory", []):
    overall_cats.append({
        "title": c.get("categoryTitle", ""),
        "time": c.get("readingTime", 0),
        "count": c.get("readingCount", 0),
    })
overall_data["preferCategories"] = overall_cats

# readTimes for year distribution
yearly_times = {}
read_times = overall.get("readTimes", {})
for k, v in read_times.items():
    yearly_times[k] = v
overall_data["yearlyReadTimes"] = yearly_times

# readLongest from overall
overall_top = []
for r in overall.get("readLongest", []):
    b = r.get("book", {})
    overall_top.append({
        "title": b.get("title", ""),
        "author": b.get("author", ""),
        "cover": b.get("cover", ""),
        "readTime": r.get("readTime", 0),
    })
overall_data["topBooks"] = overall_top[:20]

# yearReport for historical years
year_reports = []
for yr in overall.get("yearReport", []):
    year_reports.append({
        "year": yr.get("year", 0),
        "totalTime": sum(yr.get("times", [])),
    })
overall_data["yearReports"] = year_reports

# preferTime分布
prefer_time = annual.get("preferTime", [])
annual_data["preferTime"] = prefer_time
annual_data["preferTimeWord"] = annual.get("preferTimeWord", "")

# ─── Extract notebook data ───
notebook_books = []
for nb in notebooks.get("books", []):
    b = nb.get("book", {})
    notebook_books.append({
        "id": b.get("bookId", ""),
        "title": b.get("title", ""),
        "author": b.get("author", ""),
        "cover": b.get("cover", ""),
        "reviewCount": nb.get("reviewCount", 0),
        "noteCount": nb.get("noteCount", 0),
        "bookmarkCount": nb.get("bookmarkCount", 0),
        "totalNotes": nb.get("reviewCount", 0) + nb.get("noteCount", 0) + nb.get("bookmarkCount", 0),
        "sort": nb.get("sort", 0),
    })
notebook_books.sort(key=lambda x: x["totalNotes"], reverse=True)

# ─── Build unified stats ───
# Bookshelf stats
finished_count = sum(1 for b in books_data if b["finished"])
total_books = len(books_data) + len(shelf.get("albums", []))

# Category distribution
cats = {}
for b in books_data:
    c = b["category"] or "未分类"
    cats[c] = cats.get(c, 0) + 1
category_dist = sorted([{"name": k, "count": v} for k, v in cats.items()], key=lambda x: x["count"], reverse=True)

# Author stats from shelf
authors = {}
for b in books_data:
    a = b["author"] or "佚名"
    authors[a] = authors.get(a, 0) + 1
author_list = sorted([{"name": k, "count": v} for k, v in authors.items() if v >= 2], key=lambda x: x["count"], reverse=True)

# Archive/book lists
archives = []
for arc in shelf.get("archive", []):
    archives.append({
        "name": arc.get("name", ""),
        "bookIds": arc.get("bookIds", []),
        "count": len(arc.get("bookIds", [])),
    })

# ─── Write data files ───
data_files = {
    "books.json": books_data,
    "annual.json": annual_data,
    "overall.json": overall_data,
    "notebooks.json": notebook_books,
    "summary.json": {
        "totalBooks": total_books,
        "finishedCount": finished_count,
        "totalNoteCount": notebooks.get("totalNoteCount", 0),
        "notebookBooksCount": notebooks.get("totalBookCount", 0),
        "categories": category_dist,
        "topAuthors": author_list,
        "archives": archives,
    }
}

for filename, data in data_files.items():
    path = os.path.join(out_dir, filename)
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    print(f"Written: {path} ({len(json.dumps(data, ensure_ascii=False))} chars)")

# Print summary
print(f"\n=== SUMMARY ===")
print(f"Total books in shelf: {total_books}")
print(f"Finished: {finished_count}")
print(f"Total notes: {notebooks.get('totalNoteCount', 0)}")
print(f"Books with notes: {notebooks.get('totalBookCount', 0)}")
print(f"Annual readTime: {annual_data['totalReadTimeSec']}s = {annual_data['totalReadTimeSec']/3600:.1f}h")
print(f"Annual readDays: {annual_data['readDays']}")
print(f"Overall readTime: {overall_data['totalReadTimeSec']}s = {overall_data['totalReadTimeSec']/3600:.1f}h")
print(f"Overall readDays: {overall_data['readDays']}")
print(f"Top categories: {[(c['name'], c['count']) for c in category_dist[:5]]}")
print(f"Top authors (>=2 books): {[(a['name'], a['count']) for a in author_list[:5]]}")
print(f"Archives: {[(a['name'], a['count']) for a in archives]}")
