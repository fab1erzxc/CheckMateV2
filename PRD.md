## Problem Statement

The user (a student living with their girlfriend in Northern Cyprus) needs to track shared expenses and debts. Currently, they manually collect receipts and calculate who owes whom, which is time-consuming and error-prone. Receipts from Northern Cyprus have non-standard formats with abbreviations and unclear product names, making manual parsing difficult.

## Solution

A smart receipt scanner, expense tracker, and debt calculator that:
1. Scans receipts via camera/gallery or accepts text input
2. Uses AI to extract items, prices, and dates
3. Normalizes product names using a learning dictionary
4. Categorizes expenses automatically
5. Allows manual assignment of ownership (who consumed each item)
6. Calculates debts between the two users
7. Provides detailed statistics with filters
8. Works as a PWA on a local server (no cloud costs)

## User Stories

1. As a user, I want to scan a receipt photo so that I don't have to manually enter each item
2. As a user, I want to take a photo of a receipt using my phone camera
3. As a user, I want to select a receipt photo from my phone's gallery
4. As a user, I want to enter expenses as text (e.g., "Coca-Cola 40 lira, potatoes 120 lira")
5. As a user, I want the AI to automatically extract items and prices from receipt images
6. As a user, I want the AI to ignore irrelevant lines like totals, tax, and discounts
7. As a user, I want the AI to categorize items into categories like "basic food", "snacks", "alcohol", etc.
8. As a user, I want to correct AI-extracted item names when they're wrong
9. As a user, I want to correct AI-assigned categories when they're wrong
10. As a user, I want to assign each item to either myself, my girlfriend, or split 50/50
11. As a user, I want the system to remember my corrections in a dictionary for future receipts
12. As a user, I want to see the current debt balance between us as a single number
13. As a user, I want to partially or fully settle a debt
14. As a user, I want to see detailed statistics with charts and filters
15. As a user, I want to filter statistics by time period (week, month, 3 months, year, custom)
16. As a user, I want to filter statistics by category
17. As a user, I want to filter statistics by person (me, girlfriend, both)
18. As a user, I want to see separate statistics blocks for my expenses, her expenses, and total expenses
19. As a user, I want 50/50 items to count as half in personal statistics
20. As a user, I want to export statistics as an HTML file with charts
21. As a user, I want the HTML export to include the current balance and charts
22. As a user, I want automatic backups of the database when the server stops
23. As a user, I want old backups cleaned up (keep last 5)
24. As a user, I want to manage the dictionary (view, edit, delete entries)
25. As a user, I want to add manual expenses without a receipt
26. As a user, I want manual expenses to default to today's date with option to change
27. As a user, I want to see my recent transactions on the main screen
28. As a user, I want a dark theme for the interface
29. As a user, I want the app to work as a PWA (installable on home screen)
30. As a user, I want to access the app from my phone over Wi-Fi
31. As a user, I want the app to work offline (at least view cached data)
32. As a user, I want to specify who paid for each receipt (payer)
33. As a user, I want the system to calculate debts based on who paid vs who consumed
34. As a user, I want to see charts for expenses by category, time, and person
35. As a user, I want to add custom categories beyond the predefined ones
36. As a user, I want the AI to suggest categories based on the dictionary
37. As a user, I want fallback to OpenRouter if Gemini/DeepSeek fails
38. As a user, I want the system to show clear error messages when AI parsing fails
39. As a user, I want to start the server manually when needed (no always-on requirement)
40. As a user, I want to see a loading indicator while AI processes receipts
41. As a user, I want to cancel receipt processing if it takes too long
42. As a user, I want to delete receipts and have the balance recalculate
43. As a user, I want to edit existing receipts after saving
44. As a user, I want to see the total amount for each receipt
45. As a user, I want to search through my receipts by date or content
46. As a user, I want the app to remember my last used settings
47. As a user, I want to see a summary of today's expenses on the main screen
48. As a user, I want to receive confirmation before deleting items
49. As a user, I want the dictionary to improve over time as I correct more items
50. As a user, I want to see which items are most frequently corrected (to improve AI)

## Implementation Decisions

### Architecture
- **Frontend:** React PWA with dark theme
- **Backend:** Express.js REST API
- **Database:** SQLite (single file, no server)
- **AI Services:** Gemini Vision for receipt images, DeepSeek for text processing, OpenRouter as fallback
- **Charts:** Recharts library

### Project Structure
```
checkmate/
├── client/          # React PWA
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   └── ...
│   └── public/
├── server/          # Express API
│   ├── routes/
│   ├── services/    # Gemini, DeepSeek, dictionary
│   └── db/
├── data.db          # SQLite
├── backups/
├── .env
└── package.json
```

### Database Schema
- **users:** 2 records (user and girlfriend)
- **receipts:** id, date, payer (user_id), currency, total_amount
- **receipt_items:** id, receipt_id, raw_text, normalized_name, category, price, owner (user_id or '50-50')
- **categories:** id, name, is_custom
- **dictionary:** id, raw_text, normalized_name, category
- **debts:** id, from_user, to_user, amount, settled, settled_at
- **debt_settlements:** id, debt_id, amount, settled_at

### API Endpoints
```
POST /api/receipts          - create receipt (photo or text)
GET  /api/receipts          - list receipts
GET  /api/receipts/:id      - receipt with items
PUT  /api/receipts/:id      - update receipt
DELETE /api/receipts/:id    - delete receipt

POST /api/expenses          - manual expense
GET  /api/expenses          - list expenses

GET  /api/stats             - statistics (with filters)
GET  /api/balance           - current balance
POST /api/settlement        - settle debt

GET  /api/dictionary        - dictionary
POST /api/dictionary        - add entry
PUT  /api/dictionary/:id    - update entry
DELETE /api/dictionary/:id  - delete entry

POST /api/parse/receipt     - AI parse receipt (photo/text)
POST /api/parse/text        - AI parse text

GET  /api/export/html       - generate HTML export
```

### Debt Calculation Logic
- Each receipt has a `payer` (who paid the bill)
- Each item has an `owner` (who consumed it): user, girlfriend, or 50-50
- If owner = user and payer = girlfriend → user owes girlfriend
- If owner = girlfriend and payer = user → girlfriend owes user
- If owner = 50-50 → split cost equally between both

### AI Integration
- **Gemini Vision:** Process receipt images, extract items with prices
- **DeepSeek:** Process text input, extract items with prices
- **OpenRouter:** Fallback if primary AI fails
- **Dictionary:** Auto-updated when user corrects items

### PWA Requirements
- HTTPS with self-signed certificate for local network access
- Service worker for offline caching
- Manifest for home screen installation
- Dark theme

### Backup Strategy
- Auto-backup database when server stops
- Store backups in `backups/` directory with timestamps
- Keep only last 5 backups

### Environment Variables
```
GEMINI_API_KEY=xxx
DEEPSEEK_API_KEY=xxx
OPENROUTER_API_KEY=xxx
```

### Development Approach
- TDD with vertical integration (test full features, not isolated units)
- Iterative development (one feature at a time)
- Manual testing after each feature

## Testing Decisions

### Testing Philosophy
- Test external behavior, not implementation details
- Focus on business logic (debt calculation, parsing, categorization)
- Integration tests over unit tests where possible

### Key Test Areas
1. **Debt Calculation:** Test all combinations of payer/owner/50-50
2. **AI Parsing:** Test with sample receipts and text inputs
3. **Dictionary:** Test lookup, update, and fuzzy matching
4. **Statistics:** Test filters and aggregation
5. **API Endpoints:** Test CRUD operations and error handling

### Test Strategy
- Write tests before implementation (TDD)
- Test complete user flows (scan → edit → save → view stats)
- Use real SQLite database in tests (not mocks)
- Mock AI services for deterministic tests
- Manual testing on actual phone for PWA features

### Prior Art
- Similar to existing expense tracking apps but with AI parsing
- PWA testing patterns from React documentation
- SQLite testing with in-memory databases

## Out of Scope

1. **Multi-user beyond 2 people** - only two users (user and girlfriend)
2. **Real-time sync** - manual startup, no always-on server
3. **Cloud backup** - local only
4. **Advanced reporting** - basic charts only
5. **Bank integration** - manual entry only
6. **Receipt OCR for multiple languages** - focus on Turkish/English
7. **Mobile app store distribution** - PWA only
8. **Complex debt splitting** - only simple 50/50 or individual
9. **Recurring expenses** - manual entry each time
10. **Budget alerts** - not in initial version

## Further Notes

### Northern Cyprus Receipt Challenges
- Non-standard receipt formats
- Product names may be abbreviated or misspelled
- Mixed Turkish/English text
- Various currencies (primarily Turkish Lira)

### Issue Tracker
All issues have been created in GitHub: https://github.com/fab1erzxc/CheckMateV2/issues
Issues are labeled with `ready-for-agent` and numbered #8-#23.

### Development Order
1. Initialize project structure (#8)
2. Set up React frontend with dark theme (#9)
3. Set up Express backend (#10)
4. Create SQLite database schema (#11)
5. Seed database with default data (#12)
6. Implement receipt CRUD API (#13)
7. Implement dictionary CRUD API (#14)
8. Implement DeepSeek text parsing service (#15)
9. Implement Gemini Vision photo parsing service (#16)
10. Create text input page (#17)
11. Create photo capture page (#18)
12. Create receipt editing page (#19)
13. Implement debt calculation logic (#20)
14. Create balance page (#21)
15. Implement statistics aggregation (#22)
16. Create statistics page with charts (#23)

### Future Considerations (Out of Scope Now)
- Full multi-currency support with conversion
- Advanced AI for better receipt parsing
- Receipt storage and organization
- Export to accounting software
- Family sharing beyond two people

### Success Metrics
- Time saved on manual expense tracking
- Accuracy of AI parsing (reduced manual corrections)
- User satisfaction with debt calculation
- Ease of use on mobile devices