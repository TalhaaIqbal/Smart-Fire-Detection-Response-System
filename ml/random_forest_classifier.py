import pandas as pd
import joblib
import matplotlib.pyplot as plt
import seaborn as sns

from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, confusion_matrix, accuracy_score

# 1. Load Dataset
df = pd.read_csv("dataset.csv")

X = df[['smoke', 'flame', 'temperature', 'humidity']]
y = df['label']

CLASS_NAMES = ['Normal', 'Warning', 'Fire']

# 2. Split Dataset
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)

# 3. Train Model
model = RandomForestClassifier(n_estimators=100, random_state=42, max_depth=10, n_jobs=-1)
model.fit(X_train, y_train)

# 4. Predict
y_pred = model.predict(X_test)
acc = accuracy_score(y_test, y_pred)

# 5. Evaluate Model
print("=" * 50)
print(f"  Accuracy : {acc * 100:.2f}%")
print("=" * 50)
print("\nClassification Report:")
print(classification_report(y_test, y_pred, target_names=CLASS_NAMES))

# 6. Confusion Matrix
cm = confusion_matrix(y_test, y_pred)
plt.figure(figsize=(10, 7))
sns.heatmap(cm, annot=True, fmt='d', cmap='Blues', xticklabels=CLASS_NAMES, yticklabels=CLASS_NAMES)
plt.title('Confusion Matrix')
plt.xlabel('Predicted')
plt.ylabel('Actual')
plt.show()

# 7. Save Model
joblib.dump(model, 'fire_detection_model.pkl')
print("Model saved as 'fire_detection_model.pkl'")