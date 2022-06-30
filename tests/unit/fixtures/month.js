export default {
  data: {
    week_data: [
      {
        "name": "Aboma (10029)",
        "weeks": {
          "43": [
            {
              "day": 25,
              "order_id": 1170,
              "status": "aangemaakt door AnonymousUser",
              "order_type": "sales"
            }
          ]
        }
      },
      {
        "name": "Ambulance Oost (10002)",
        "weeks": {
          "43": [
            {
              "day": 27,
              "order_id": 1131,
              "status": "aangemaakt door AnonymousUser",
              "order_type": "sales"
            },
            {
              "day": 26,
              "order_id": 1132,
              "status": "aangemaakt door AnonymousUser",
              "order_type": "sales"
            }
          ]
        }
      }
    ],
    "statuses_data": {
      "22": {
        "statuscodes": {
          "workorders signed": {
            "count": 2,
            "perc": 0.6666666666666666
          }, "opdracht klaar": {"count": 1, "perc": 0.3333333333333333}
        }, "total": 3
      },
      "23": {
        "statuscodes": {
          "unknown": {"count": 3, "perc": 0.17647058823529413},
          "opdracht klaar": {"count": 4, "perc": 0.23529411764705882},
          "workorders signed": {"count": 7, "perc": 0.4117647058823529},
          "gewijzigd door": {"count": 1, "perc": 0.058823529411764705},
          "begin opdracht": {"count": 1, "perc": 0.058823529411764705},
          "aangemaakt": {"count": 1, "perc": 0.058823529411764705}
        }, "total": 17
      },
      "24": {
        "statuscodes": {
          "Opdracht toegewezen": {"count": 7, "perc": 0.5833333333333334},
          "workorders signed": {"count": 3, "perc": 0.25},
          "aangemaakt": {"count": 1, "perc": 0.08333333333333333},
          "opdracht klaar": {"count": 1, "perc": 0.08333333333333333}
        }, "total": 12
      }
    }
  }
}
