# API Tubes Lasti

Comprehensive documentation for the API endpoints provided by the Tubes Lasti application. Each endpoint includes details on request payloads, responses, and usage.

## Table of Contents

- [Endpoints](#endpoints)
  - [Authentication](#authentication)
  - [Inventories](#inventories)
  - [Orders](#orders)

---

### API Documentation Table

| Method | Endpoint                        | Usage                                                                 |
|--------|---------------------------------|-----------------------------------------------------------------------|
| POST   | `/register`                     | Membuat account baru                                                 |
| POST   | `/login`                        | Login dengan account yang telah didaftarkan dan mendapatkan JWT token |
| GET    | `/inventories`                  | Mendapatkan seluruh inventory yang ada                               |
| POST   | `/inventories`                  | Membuat inventory baru                                               |
| PUT    | `/inventories/:id`              | Mengupdate inventory berdasarkan id                                  |
| GET    | `/orders`                       | Mendapatkan seluruh order yang pernah dibuat oleh account tertentu   |
| POST   | `/orders`                       | Membuat order baru                                                   |
| PUT    | `/orders/:id/paidstatus`        | Mengubah status pembayaran dari uncomplete menjadi completed         |
| PUT    | `/orders/:id/takenstatus`       | Mengubah status pembayaran dari untaken menjadi taken                |
| PUT    | `/orders/:id/returnedstatus`    | Mengubah status pembayaran dari unreturned menjadi returned          |

---

## Endpoints

### Authentication

#### POST `/register`
- **Description**: Creates a new user account.
- **Request Body**:
  ```json
  {
    "name": "string",
    "email": "string",
    "password": "string (min. 8 characters)"
  }
  ```
- **Responses**:
  - **201 (Success)**:
    ```json
    {
      "status": "success",
      "message": "Register success",
      "data": {}
    }
    ```
  - **400 (Error)**:
    ```json
    {
      "status": "error",
      "message": "Register error: {error message}",
      "data": {}
    }
    ```

#### POST `/login`
- **Description**: Authenticates a user and returns a JWT token.
- **Request Body**:
  ```json
  {
    "email": "string",
    "password": "string"
  }
  ```
- **Responses**:
  - **200 (Success)**:
    ```json
    {
      "status": "success",
      "message": "Login success",
      "data": {
        "user": "email",
        "token": "string"
      }
    }
    ```
  - **400 (Error)**:
    ```json
    {
      "status": "error",
      "message": "Login error: {error message}",
      "data": {}
    }
    ```

---

### Inventories

#### GET `/inventories`
- **Description**: Retrieves all available inventory items.
- **Responses**:
  - **200 (Success)**:
    ```json
    {
      "status": "success",
      "message": "GET inventories success",
      "data": {
        "inventories": [/* Array of Inventory */]
      }
    }
    ```
  - **404 (No Data)**:
    ```json
    {
      "status": "success",
      "message": "No inventories found",
      "data": {
        "inventories": []
      }
    }
    ```
  - **400 (Error)**:
    ```json
    {
      "status": "error",
      "message": "Error GET Inventory: {error message}",
      "data": {}
    }
    ```

#### POST `/inventories`
- **Description**: Creates a new inventory item.
- **Responses**:
  - **201 (Success)**:
    ```json
    {
      "status": "success",
      "message": "Inventory created successfully.",
      "data": {
        "inventories": { /* Saved Inventory */ }
      }
    }
    ```
  - **400 (Error)**:
    ```json
    {
      "status": "error",
      "message": "Error POST Inventory: {error message}",
      "data": {}
    }
    ```

#### PUT `/inventories/:id`
- **Description**: Updates an inventory item by ID.
- **Responses**:
  - **200 (Success)**:
    ```json
    {
      "status": "success",
      "message": "Inventory updated successfully.",
      "data": {
        "inventories": { /* Updated Inventory */ }
      }
    }
    ```
  - **400 (Error)**:
    ```json
    {
      "status": "error",
      "message": "Error PUT Inventory: {error message}",
      "data": {}
    }
    ```

---

### Orders

#### GET `/orders`
- **Description**: Retrieves all orders for a specific user.
- **Responses**:
  - **200 (Success)**:
    ```json
    {
      "status": "success",
      "message": "GET Orders success",
      "data": {
        "orders": [ /* Array of Orders */ ]
      }
    }
    ```
  - **404 (No Data)**:
    ```json
    {
      "status": "success",
      "message": "No orders found",
      "data": {
        "orders": []
      }
    }
    ```
  - **400 (Error)**:
    ```json
    {
      "status": "error",
      "message": "Error GET Order: {error message}",
      "data": {}
    }
    ```

#### POST `/orders`
- **Description**: Creates a new order.
- **Request Body**:
  ```json
  {
    "email": "string",
    "orderStatus": [
      {
        "phoneNumber": "string",
        "idCard": "string",
        "orderDate": "string (ISO format)",
        "takenDate": "string (ISO format)",
        "returnDate": "string (ISO format)",
        "paymentStatus": "completed | uncomplete",
        "takenStatus": "taken | untaken",
        "returnStatus": "returned | unreturned"
      }
    ]
  }
  ```
- **Responses**:
  - **201 (New Order Created)**:
    ```json
    {
      "status": "success",
      "message": "Order created successfully.",
      "data": {
        "order": { /* New Order Data */ }
      }
    }
    ```
  - **200 (Order Updated)**:
    ```json
    {
      "status": "success",
      "message": "Order status added successfully.",
      "data": {
        "order": { /* Updated Order */ }
      }
    }
    ```
  - **400 (Invalid Input)**:
    ```json
    {
      "status": "error",
      "message": "Invalid input: {error message}",
      "data": {}
    }
    ```

#### PUT `/orders/:id/paidstatus`
- **Description**: Updates payment status of an order to `completed`.
- **Responses**:
  - **200 (Success)**:
    ```json
    {
      "status": "success",
      "message": "Payment status updated to completed",
      "data": {
        "order": { /* Updated Order */ }
      }
    }
    ```
  - **200 (Order Not Found)**:
    ```json
    {
      "status": "success",
      "message": "Order status not found",
      "data": {}
    }
    ```
  - **400 (Error)**:
    ```json
    {
      "status": "error",
      "message": "Internal Server Error: {error message}",
      "data": {}
    }
    ```

#### PUT `/orders/:id/takenstatus`
- **Description**: Updates taken status of an order to `taken`.
- **Responses**:
  - **200 (Success)**:
    ```json
    {
      "status": "success",
      "message": "Taken status updated to completed",
      "data": {
        "order": { /* Updated Order */ }
      }
    }
    ```
  - **200 (Order Not Found)**:
    ```json
    {
      "status": "success",
      "message": "Order status not found",
      "data": {}
    }
    ```
  - **400 (Error)**:
    ```json
    {
      "status": "error",
      "message": "Internal Server Error: {error message}",
      "data": {}
    }
    ```

#### PUT `/orders/:id/returnedstatus`
- **Description**: Updates return status of an order to `returned`.
- **Responses**:
  - **200 (Success)**:
    ```json
    {
      "status": "success",
      "message": "Returned status updated to completed",
      "data": {
        "order": { /* Updated Order */ }
      }
    }
    ```
  - **200 (Order Not Found)**:
    ```json
    {
      "status": "success",
      "message": "Order status not found",
      "data": {}
    }
    ```
  - **400 (Error)**:
    ```json
    {
      "status": "error",
      "message": "Internal Server Error: {error message}",
      "data": {}
    }
    
