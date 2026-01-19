# Testing Guide: Staff-to-Main Account Sync & Subscription Inheritance

This document provides step-by-step testing instructions for verifying:
1. Staff-added products reflect in the main account
2. Staff members inherit the main account's subscription

---

## Prerequisites

- Access to the FahamPesa web app
- A main account (business owner) with active subscription (Pro plan)
- A staff account linked to the main account
- A second main account with **free** plan (to test limit enforcement)

---

## Test Scenario 1: Staff-Added Products Appear in Main Account

### Setup
1. Log in as the **main account owner**
2. Note the current number of products in **Dashboard > Products**
3. Log out

### Test Steps
1. Log in as a **staff member** linked to the owner
2. Navigate to **Dashboard > Products**
3. Verify you can see all the owner's existing products
4. Click **Add Product** and create a new product:
   - Name: "Staff Test Product"
   - Category: Any category
   - Selling Price: 100
   - Quantity: 10
5. Submit the product
6. Verify the product appears in the products list
7. Log out

### Verification
1. Log back in as the **main account owner**
2. Navigate to **Dashboard > Products**
3. ✅ **PASS:** The "Staff Test Product" should be visible
4. ✅ **PASS:** Click on the product - verify `createdBy` field shows the staff's user ID (optional - check in Firestore console)

---

## Test Scenario 2: Staff Inherits Pro Subscription

### Setup
1. Ensure the main account owner has an **active Pro subscription**
2. Log in as a staff member linked to this owner

### Test Steps
1. As staff, navigate to **Dashboard > Products**
2. Attempt to add products beyond the free limit (10+ products)
3. ✅ **PASS:** No upgrade modal should appear (staff inherits Pro = unlimited)

4. Navigate to **Dashboard > Reports**
5. ✅ **PASS:** Reports should be accessible (Pro feature)

6. Navigate to **Dashboard > Sales**
7. Record multiple sales in a single day (beyond free limit of 10)
8. ✅ **PASS:** No limit warnings should appear

---

## Test Scenario 3: Staff Respects Free Plan Limits

### Setup
1. Create/use a main account with **free plan** (no active subscription)
2. Create a staff member linked to this free account

### Test Steps
1. Log in as the staff member
2. Navigate to **Dashboard > Products**
3. If there are already 10 products, try to add another
4. ✅ **PASS:** Upgrade modal should appear ("You've reached the Products limit (10) for the Free plan")

5. Navigate to **Dashboard > Reports**
6. ✅ **PASS:** Reports should be locked/show upgrade prompt

---

## Test Scenario 4: Product Data Isolation Between Businesses

### Setup
- Main Account A (Owner A) with Staff A
- Main Account B (Owner B) with Staff B

### Test Steps
1. Log in as Staff A
2. Add a product: "Owner A Product"
3. Log out

4. Log in as Staff B
5. Navigate to Products
6. ✅ **PASS:** "Owner A Product" should NOT be visible (data is isolated to Owner A)

7. Log in as Owner A
8. ✅ **PASS:** "Owner A Product" should be visible

---

## Test Scenario 5: Sales Page Staff Behavior

### Test Steps
1. Log in as staff member (linked to Pro account owner)
2. Navigate to **Dashboard > Sales**
3. Verify all owner's products appear in the product selector
4. Record a sale
5. Log out

### Verification
1. Log in as owner
2. Navigate to **Dashboard > Sales**
3. ✅ **PASS:** The sale recorded by staff should appear
4. ✅ **PASS:** Sale should have the correct `userId` (owner's ID)

---

## Firestore Data Verification (Optional - Advanced)

For developers with Firebase Console access:

### Check Product Document
```
Collection: products
Document: [newly created product ID]

Expected fields:
- userId: [owner's UID] ← Not staff's UID
- createdBy: [staff's UID] ← The actual person who created it
- name, category, price, etc.
```

### Check Subscription Query
Staff should be querying subscriptions with owner's userId:
```
Collection: subscriptions
Query: where('userId', '==', '[owner's UID]')
```

---

## Troubleshooting

### Issue: Staff sees no products
- **Cause:** `effectiveUserId` not being computed correctly
- **Check:** Verify `StaffContext` is providing `staff.userId` (owner's ID)

### Issue: Staff hits free plan limits despite owner having Pro
- **Cause:** `usePlanLimits` hook not using `effectiveUserId`
- **Check:** Verify the hook imports `useStaff` and computes `effectiveUserId`

### Issue: Staff-added products don't appear for owner
- **Cause:** `createProduct` using staff's UID instead of `effectiveUserId`
- **Check:** Verify products page passes `effectiveUserId` to `createProduct()`

---

## Summary of Changes Made

| File | Change |
|------|--------|
| `src/app/dashboard/products/page.tsx` | Added `useStaff`, computed `effectiveUserId`, used for all data operations, added `createdBy` field |
| `src/hooks/usePlanLimits.ts` | Added `useStaff`, uses `effectiveUserId` for subscription checks and limit counting |
| `src/hooks/useSubscriptionStatus.ts` | Added `useStaff`, uses `effectiveUserId` for profile lookups |

---

## Test Checklist

- [ ] Staff can see owner's products
- [ ] Staff-added products appear for owner
- [ ] Staff inherits owner's Pro subscription
- [ ] Staff respects owner's free plan limits
- [ ] Products have `createdBy` field showing who added them
- [ ] Data isolation works between different businesses
- [ ] Sales recorded by staff appear in owner's dashboard
