export default {
  data: {
    "top_materials_used": [
      {"num_used": 275.0, "materialname": "PVC Klem"}, {
      "num_used": 268.0,
      "materialname": "Laselektroden "
    }, {"num_used": 230.0, "materialname": "Carrosseriering "}, {
      "num_used": 220.0,
      "materialname": "Anker M8-12"
    }],
    "top_50_customers": [{
      "customer_name": "Stormy",
      "count": 37
    }],
    "top_customer_sales_by_profit": [{"customer_name": "Fictie BV", "profit": 0.0}],
    "top_material_sales_by_profit": [{
      "material_name": "Prof. Montagehandschoenen maat  M,L en XL",
      "profit": 0.0
    }],
    "order_count_per_month": [{"month": "2023-01-01", "count": 102}, {
      "month": "2023-02-01",
      "count": 74
    }, {"month": "2023-03-01", "count": 69}, {
      "month": "2023-04-01",
      "count": 52
    }, {"month": "2023-05-01", "count": 46}, {
      "month": "2023-06-01",
      "count": 5
    }, {"month": "2023-09-01", "count": 1}],
    "assigned_count": [{"assigned_count": 5, "first_name": "Piet", "last_name": "Paulusma"}, {
      "assigned_count": 1,
      "first_name": "Henk",
      "last_name": "Pieters"
    }],
    "transactions": {
      "total": 3803,
      "order_action_email_workorders": {
        "text": "order action email workorders",
        "total": 559,
        "perc": 14.7
      },
      "order_action_status": {"text": "order action status", "total": 599, "perc": 15.75},
      "core_action_fcm": {"text": "core action fcm", "total": 534, "perc": 14.04},
      "core_action_mail": {"text": "core action mail", "total": 2111, "perc": 55.51}
    },
    "order_status_counts": {
      "total": 349,
      "aangemaakt": {"text": "aangemaakt", "total": 7, "perc": 2.01},
      "begin_opdracht": {"text": "begin opdracht", "total": 2, "perc": 0.57},
    },
    "order_type_counts": {
      "total": 349,
      "storing": {"text": "Storing", "total": 117, "perc": 33.52},
      "reparatie": {"text": "Reparatie", "total": 42, "perc": 12.03},
      "onderhoud": {"text": "Onderhoud", "total": 21, "perc": 6.02},
    }
  }
}
