# CacheNCarry: 
#### Where "left behind" meets `LEFT JOIN`.
---


CacheNCarry is an end-of-semester storage management system designed to track and manage student belongings (cloakroom luggage + a mattress). The system ensures easy check-in/check-out processes, reduces human error, and provides traceability for checked-in bags and misplaced mattresses.

## Flow

### 1. Student Registration

At the end of each semester, a `student` registers their `belonging(s)`:
- Belongings can be of two types: `luggage` or `mattress`.
- Each item is assigned a unique `UUID`.
- A QR code is generated for each item and must be printed and physically attached to the respective belonging by the student.

### 2. Item Check-In

At the warehouse:
- A `staff` member scans a QR code on the student's phone to begin a `session`, associating the session with that student, and logging check-in time.
- The QR codes on each belonging are scanned to link them to the student and register them into the system.

### 3. Storage Period

- Belongings remain in the warehouse during the student's absence.
- Mattresses are handled separately: at the start of the semester, they are moved directly to student rooms by university workers.

### 4. Item Retrieval (Check-Out)

Upon the student's return:
- The student visits the warehouse.
- Staff scan the student’s QR code to reopen the corressponding check-in session.
- For each item:
  - **Luggage**: The system validates whether the scanned luggage belongs to the student in session. If ownership does not match, the item cannot be checked out.
  - **Mattress**: Since the mattress is already placed in the student’s room, the staff scan both the student and the mattress QR code to validate ownership.

### 5. Misplacement Handling

If a scanned mattress does not belong to the student:
- An `incident` is opened.
- Because all mattresses are uniquely tagged and linked to their rightful owners, it can be easily determined:
  - Who the mattress actually belongs to.
  - Who mistakenly received another student’s mattress.
- This allows staff to resolve such incidents efficiently without manual investigation.

