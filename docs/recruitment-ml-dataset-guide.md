# Recruitment Email Classification - ML Dataset Guide

## Overview

This guide walks you through building a custom ML dataset from your Gmail recruitment emails and training a hierarchical classifier using scikit-learn.

## 📊 Dataset Export (Step 1)

### Using the Web Interface

**Access Requirements**: Admin access (MO_ADMIN role)

**Note**: Currently, the admin exports emails from **their own Gmail account**. The admin must first connect their Gmail via `/interactions/email-sync` before using the dataset export feature. For exporting from other users' accounts, see Future Enhancements below.

1. **Navigate to Admin Panel**
   - Click on your profile menu (top right)
   - Select "Admin Panel" (visible only to admins)
   - Or go directly to: `http://localhost:4200/admin`

2. **Access Dataset Export**
   - Click on "ML Dataset Export" card
   - Or go directly to: `http://localhost:4200/admin/dataset-export`
   - Ensure you're logged in and Gmail is connected

2. **Configure Export Settings**
   - **Days to Look Back**: How far back to search (default: 365 days)
   - **Max Emails**: Maximum emails to export (default: 500)
   - **Include Inbox**: ✅ Recommended (receives recruiter emails)
   - **Include Sent**: ✅ Recommended (your replies provide context)

3. **Export Options**
   - **CSV Export**: Best for manual labeling in Excel/Google Sheets
   - **JSON Export**: Best for programmatic processing

### API Endpoints

If you prefer direct API access:

```bash
# Preview first 10 emails
GET /api/email/dataset/preview?sinceDays=30

# Export full dataset as JSON
POST /api/email/dataset/export
{
  "sinceDays": 365,
  "maxResults": 500,
  "includeSent": true,
  "includeInbox": true
}

# Export as CSV for labeling
POST /api/email/dataset/export/csv
```

## 🏷️ Labeling Your Dataset (Step 2)

### Label Categories

Use these standardized labels:

| Label | Description | Examples |
|-------|-------------|----------|
| `outreach` | Initial cold recruiter contact | "Hi, I came across your profile...", "Are you open to new opportunities?" |
| `cv_requested` | Recruiter asks for resume/CV | "Could you send me your updated resume?", "Please share your CV" |
| `cv_submitted` | Confirmation of application receipt | "Thanks for submitting your application", "We've received your CV" |
| `interview_scheduled` | Interview invitation or confirmation | "We'd like to schedule an interview", "Your interview is confirmed for..." |
| `interview_feedback` | Post-interview updates (rejection/offer) | "Thank you for interviewing", "We're pleased to offer you...", "Unfortunately..." |
| `follow_up` | Status check or follow-up emails | "Any update on my application?", "Just checking in..." |
| `non_recruitment` | Not recruitment related | Newsletters, LinkedIn notifications, spam |

### Labeling Best Practices

1. **Use Consistent Labels**: Always use lowercase, underscore-separated labels
2. **Start Small**: Label 100-200 emails first to test your classifier
3. **Balance Classes**: Try to get ~50-100 examples per category
4. **Ambiguous Cases**: When in doubt, use the most specific label that applies
5. **Quality Over Quantity**: Accurate labels are more important than many labels

### CSV Labeling Workflow

1. Open exported CSV in Excel or Google Sheets
2. Review the `subject`, `snippet`, and `body_preview` columns
3. Add the appropriate label to the `label` column
4. Save the file as `recruitment_emails_labeled.csv`

## 🤖 Building the ML Model (Step 3)

### Python Setup

Create a Python project for your classifier:

```bash
mkdir recruitment-classifier
cd recruitment-classifier
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install pandas scikit-learn numpy transformers torch
```

### Project Structure

```
recruitment-classifier/
├── data/
│   ├── recruitment_emails_labeled.csv
│   └── recruitment_emails_test.csv
├── models/
│   ├── tier1_classifier.pkl  # Recruitment vs Non-recruitment
│   └── tier2_classifier.pkl  # Multi-class recruitment categories
├── notebooks/
│   ├── 01_data_exploration.ipynb
│   └── 02_model_training.ipynb
├── src/
│   ├── preprocessing.py
│   ├── train_tier1.py
│   ├── train_tier2.py
│   └── predict.py
└── requirements.txt
```

### Training Pipeline (Coming Soon)

The next steps will be:

1. **Data Preprocessing**
   - Clean email text (remove HTML, normalize whitespace)
   - Anonymize PII (names, emails, phone numbers)
   - Split train/validation/test sets (70/15/15)

2. **Tier 1: Binary Classifier**
   - Train model to detect: `recruitment` vs `non_recruitment`
   - Use Logistic Regression or Random Forest
   - Target metric: 95%+ accuracy

3. **Tier 2: Multi-class Classifier**
   - Train on recruitment emails only (filtered by Tier 1)
   - Classify into 6 categories: outreach, cv_requested, cv_submitted, interview_scheduled, interview_feedback, follow_up
   - Use TF-IDF or Sentence Embeddings + Logistic Regression
   - Target metric: 85%+ F1 score

4. **Model Evaluation**
   - Confusion matrix to identify misclassifications
   - Precision/Recall per category
   - Error analysis on misclassified emails

## 📈 Dataset Statistics

After export, you'll see:

- **Total Emails**: Number of emails exported
- **Inbox Count**: Emails you received
- **Sent Count**: Emails you sent
- **With Attachments**: Emails containing files
- **Date Range**: Oldest to newest email
- **Avg Body Length**: Average email length (for model feature engineering)

## 🔄 Iterative Improvement

1. **Start with 100 labeled emails** → Train baseline model
2. **Test on 20 new emails** → Measure accuracy
3. **Review errors** → Identify patterns in misclassifications
4. **Add more examples** → Focus on underrepresented categories
5. **Retrain** → Improve model performance
6. **Repeat** until satisfied with accuracy

## 🚧 Future Enhancements

### Admin Features (To Be Implemented)

**Multi-User Dataset Export**
- Allow admin to select which user's Gmail to export from
- Useful for aggregating datasets from multiple users
- API: `GET /api/admin/users` - List all users with Gmail connected
- API: `POST /api/admin/dataset/export/{userId}` - Export specific user's emails
- UI: User selector dropdown in dataset export page

**Incremental Export**
- Track last export date per user
- Only export new emails since last export
- Prevents duplicate labeling work
- API: `POST /api/email/dataset/export?sinceLastExport=true`

**Export Filters**
- Filter by specific senders (e.g., only LinkedIn recruiters)
- Date range picker for precise control
- Label-based filtering (re-export specific categories)
- Confidence score filtering (once model is deployed)

**Bulk Operations**
- Export from multiple users at once
- Merge datasets with deduplication
- Anonymization pipeline (auto-remove PII)

**Dataset Management**
- Save/load export configurations
- Export history and versioning
- Compare datasets across time periods

## 🚀 Production Deployment (Future)

Once your model achieves good accuracy:

1. **Save trained models**: `tier1_classifier.pkl`, `tier2_classifier.pkl`
2. **Create API endpoint**: `/api/recruitment/classify`
3. **Real-time classification**: Automatically label new emails as they arrive
4. **Active learning**: Flag low-confidence predictions for manual review

## 📚 Additional Resources

- [Scikit-learn Text Classification Tutorial](https://scikit-learn.org/stable/tutorial/text_analytics/working_with_text_data.html)
- [Hierarchical Classification in Python](https://towardsdatascience.com/hierarchical-text-classification-5d5a0e1cce3f)
- [Email Classification Dataset Examples](https://www.kaggle.com/datasets)
- [Sentence Transformers for Embeddings](https://www.sbert.net/)

## 🆘 Troubleshooting

### "No recruitment emails found"
- Check Gmail OAuth connection status
- Verify search query matches your email patterns
- Increase `sinceDays` parameter

### "Export takes too long"
- Reduce `maxResults` to fetch fewer emails
- Use smaller `sinceDays` window
- Check Gmail API quotas

### "CSV file encoding issues"
- Open CSV with UTF-8 encoding
- Use Google Sheets instead of Excel
- Re-export with different settings

---

**Next Step**: Export your dataset using the web interface at `/interactions/dataset-export` 🎯
