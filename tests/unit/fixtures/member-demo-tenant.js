/**
 * `GET /api/member/get-module-data/` as the demo tenant answered it, captured
 * with the goldens for ContractForm.
 *
 * Observed rather than invented, for two reasons. The schema declares this
 * endpoint with "No response body" (openapi/schema.yaml), so the seam has no
 * generated component to hold a fixture to and there is nothing to build one
 * from - the shape comes from `GetAllModuleData.get` in
 * `source/apps/member/views.py:52-68`, which returns
 * `{id, name, parts: [{id, name, is_always_selected}]}` per module.
 *
 * And the recorded golden holds the `module_paths_pks` string ContractForm
 * folds these checkboxes into. That string names these exact part ids in this
 * exact order, so a smaller invented tree would put a different body on the
 * wire and disagree with the recording for a reason that has nothing to do
 * with the component.
 *
 * Closing the annotation gap in the backend is the real fix; then this becomes
 * a schema-built fixture like every other response in the suite.
 */
export const moduleData = [
  {
    "id": 9,
    "name": "3d",
    "parts": [
      {
        "id": 291,
        "name": "3d",
        "is_always_selected": false
      }
    ]
  },
  {
    "id": 7,
    "name": "company",
    "parts": [
      {
        "id": 258,
        "name": "activity",
        "is_always_selected": true
      },
      {
        "id": 280,
        "name": "branches",
        "is_always_selected": false
      },
      {
        "id": 290,
        "name": "budgets",
        "is_always_selected": false
      },
      {
        "id": 255,
        "name": "company",
        "is_always_selected": true
      },
      {
        "id": 299,
        "name": "connector-gripp",
        "is_always_selected": false
      },
      {
        "id": 273,
        "name": "customer-users",
        "is_always_selected": false
      },
      {
        "id": 254,
        "name": "dashboard",
        "is_always_selected": false
      },
      {
        "id": 283,
        "name": "employee-dashboard",
        "is_always_selected": false
      },
      {
        "id": 279,
        "name": "employee-users",
        "is_always_selected": true
      },
      {
        "id": 272,
        "name": "engineer-event-types",
        "is_always_selected": false
      },
      {
        "id": 274,
        "name": "engineer-users",
        "is_always_selected": false
      },
      {
        "id": 257,
        "name": "partners",
        "is_always_selected": false
      },
      {
        "id": 259,
        "name": "pictures",
        "is_always_selected": true
      },
      {
        "id": 275,
        "name": "planning-users",
        "is_always_selected": true
      },
      {
        "id": 276,
        "name": "sales-users",
        "is_always_selected": false
      },
      {
        "id": 277,
        "name": "student-users",
        "is_always_selected": false
      },
      {
        "id": 293,
        "name": "templates",
        "is_always_selected": false
      },
      {
        "id": 281,
        "name": "time-registration",
        "is_always_selected": false
      },
      {
        "id": 256,
        "name": "users",
        "is_always_selected": true
      }
    ]
  },
  {
    "id": 6,
    "name": "customers",
    "parts": [
      {
        "id": 230,
        "name": "customers",
        "is_always_selected": false
      },
      {
        "id": 282,
        "name": "dashboard",
        "is_always_selected": false
      },
      {
        "id": 286,
        "name": "equipment",
        "is_always_selected": false
      },
      {
        "id": 287,
        "name": "locations",
        "is_always_selected": false
      },
      {
        "id": 232,
        "name": "maintenance-contracts",
        "is_always_selected": false
      },
      {
        "id": 270,
        "name": "maintenance-products",
        "is_always_selected": false
      }
    ]
  },
  {
    "id": 8,
    "name": "equipment",
    "parts": [
      {
        "id": 288,
        "name": "buildings",
        "is_always_selected": false
      },
      {
        "id": 284,
        "name": "equipment",
        "is_always_selected": false
      },
      {
        "id": 285,
        "name": "locations",
        "is_always_selected": false
      }
    ]
  },
  {
    "id": 4,
    "name": "inventory",
    "parts": [
      {
        "id": 233,
        "name": "materials",
        "is_always_selected": false
      },
      {
        "id": 244,
        "name": "move-material",
        "is_always_selected": false
      },
      {
        "id": 242,
        "name": "mutations",
        "is_always_selected": false
      },
      {
        "id": 264,
        "name": "purchaseorder-entries",
        "is_always_selected": false
      },
      {
        "id": 263,
        "name": "purchaseorders",
        "is_always_selected": false
      },
      {
        "id": 260,
        "name": "stats",
        "is_always_selected": false
      },
      {
        "id": 271,
        "name": "stats-table",
        "is_always_selected": false
      },
      {
        "id": 240,
        "name": "stock-locations",
        "is_always_selected": false
      },
      {
        "id": 266,
        "name": "supplier-reservations",
        "is_always_selected": false
      },
      {
        "id": 239,
        "name": "suppliers",
        "is_always_selected": false
      }
    ]
  },
  {
    "id": 11,
    "name": "invoices",
    "parts": [
      {
        "id": 294,
        "name": "invoice",
        "is_always_selected": false
      },
      {
        "id": 295,
        "name": "invoices",
        "is_always_selected": false
      },
      {
        "id": 296,
        "name": "preliminary",
        "is_always_selected": false
      },
      {
        "id": 297,
        "name": "sent",
        "is_always_selected": false
      }
    ]
  },
  {
    "id": 1,
    "name": "mobile",
    "parts": [
      {
        "id": 250,
        "name": "assigned-finished",
        "is_always_selected": false
      },
      {
        "id": 269,
        "name": "assignedorder-materials",
        "is_always_selected": false
      },
      {
        "id": 245,
        "name": "dispatch",
        "is_always_selected": false
      },
      {
        "id": 246,
        "name": "orders",
        "is_always_selected": false
      },
      {
        "id": 248,
        "name": "orders-finished",
        "is_always_selected": false
      },
      {
        "id": 247,
        "name": "orders-in-progress",
        "is_always_selected": false
      },
      {
        "id": 249,
        "name": "orders-unassigned",
        "is_always_selected": false
      },
      {
        "id": 251,
        "name": "timesheet",
        "is_always_selected": false
      },
      {
        "id": 262,
        "name": "trip-availability",
        "is_always_selected": false
      },
      {
        "id": 268,
        "name": "trip-statuscodes",
        "is_always_selected": false
      },
      {
        "id": 261,
        "name": "trips",
        "is_always_selected": false
      }
    ]
  },
  {
    "id": 2,
    "name": "orders",
    "parts": [
      {
        "id": 289,
        "name": "invoice",
        "is_always_selected": false
      },
      {
        "id": 229,
        "name": "month-stats",
        "is_always_selected": false
      },
      {
        "id": 223,
        "name": "orders",
        "is_always_selected": false
      },
      {
        "id": 224,
        "name": "orders-not-accepted",
        "is_always_selected": false
      },
      {
        "id": 225,
        "name": "past-orders",
        "is_always_selected": false
      },
      {
        "id": 267,
        "name": "sales-orders",
        "is_always_selected": false
      },
      {
        "id": 227,
        "name": "statuscodes",
        "is_always_selected": false
      },
      {
        "id": 226,
        "name": "workorder-orders",
        "is_always_selected": false
      },
      {
        "id": 228,
        "name": "year-stats",
        "is_always_selected": false
      }
    ]
  },
  {
    "id": 5,
    "name": "quotations",
    "parts": [
      {
        "id": 253,
        "name": "preliminary",
        "is_always_selected": false
      },
      {
        "id": 252,
        "name": "quotations",
        "is_always_selected": false
      },
      {
        "id": 298,
        "name": "sent",
        "is_always_selected": false
      }
    ]
  },
  {
    "id": 10,
    "name": "webshop",
    "parts": [
      {
        "id": 292,
        "name": "webshop",
        "is_always_selected": false
      }
    ]
  }
]

/** Contract 28 on the demo tenant, as `GET /api/member/contract/28/` answered. */
export const contract28 = {
  "id": 28,
  "name": "My24Service Normal",
  "module_paths_pks": "1:250,269,245,246,248,247,249,251,262,261,268|2:229,223,224,225,267,227,226,228,289|4:233,244,242,264,263,260,271,240,266,239|6:230,282,232|7:258,255,279,259,275,256,273,283,254,272,274,257,276,277,293,281|11:294,295,296,297",
  "modules_text": "mobile (11), orders (9), inventory (10), customers (3), company (16), invoices (4)",
  "max_users": 0,
  "created": "15/07/2024 17:21",
  "modified": "19/03/2025 15:38"
}

/**
 * Member 19 on the demo tenant, as `GET /api/member/member/19/` answered.
 *
 * Kept whole because the recorded MemberForm edit golden holds the PATCH body
 * the form built out of it, and that body is this record minus the four fields
 * `preUpdate` and `submitForm` drop.
 */
export const member19 = {
  "id": 19,
  "companycode": "shltr",
  "name": "SHLTR",
  "address": "Metaalweg 4",
  "tel": "033-2474020",
  "fax": "",
  "www": "https://shltr.tiskodev.nl/",
  "postal": "3751LS",
  "city": "Bunschoten-Spakenburg",
  "country_code": "NL",
  "email": "support@shltr-group.com",
  "contract_text": "SHLTR-Branch (orders (9), company (11), equipment (2), 3d (1), webshop (1))",
  "contract": 22,
  "contacts": "W. Buitenhuis",
  "is_deleted": false,
  "member_type": "maintenance",
  "companylogo": "http://demo.localhost:8000/media/logos/shltr/e125ed2b-7604-4854-9670-49e1f24b30b2.png",
  "companylogo_url": "/media/logos/shltr/e125ed2b-7604-4854-9670-49e1f24b30b2.png",
  "companylogo_workorder": null,
  "companylogo_workorder_url": null,
  "activities": "SHLTR Business Network\nSHLTR Installatie\nSHLTR Development\nSHLTR Warehouse Solutions\nSHLTR Service & Maintenance",
  "info": "De SHLTR Group zorgt voor innovatie, digitalisering duurzaamheid om logistieke faciliteiten te optimaliseren, effici\u00ebnter en veiliger te maken.",
  "is_public": true,
  "has_api_users": false,
  "has_branches": true,
  "chamber_of_commerce": null,
  "vat_number": null,
  "deep_link": null,
  "equipment_qr_type": "shltr",
  "is_requested": false,
  "has_mobile_activity_user_select": false,
  "created": "30/05/2023 16:25",
  "modified": "15/09/2025 16:59"
}

/** Module part 254 on the demo tenant, as `GET /api/member/module-part/254/` answered. */
export const modulePart254 = {
  "id": 254,
  "name": "dashboard",
  "module": 7,
  "module_name": "company",
  "is_always_selected": false,
  "created": "24/06/2021 13:52",
  "modified": "04/07/2021 15:41"
}

/**
 * `GET /api/member/module/?page=1` as the demo tenant answered it.
 *
 * The order matters and is why this is observed rather than invented:
 * ModulePartForm defaults a new part to `modules[0]`, so which module is first
 * decides what a plain create sends. Here that is `3d` (9), and the recorded
 * "create against a chosen module" golden sends 7 - which is what makes it a
 * choice rather than the default.
 */
export const moduleList = {
  "next": null,
  "previous": null,
  "count": 11,
  "num_pages": 1,
  "results": [
    {
      "id": 9,
      "name": "3d",
      "created": "20/02/2024 16:46",
      "modified": "20/02/2024 16:46"
    },
    {
      "id": 7,
      "name": "company",
      "created": "24/06/2021 12:38",
      "modified": "24/06/2021 12:38"
    },
    {
      "id": 6,
      "name": "customers",
      "created": "24/06/2021 12:38",
      "modified": "24/06/2021 12:38"
    },
    {
      "id": 8,
      "name": "equipment",
      "created": "30/05/2023 16:48",
      "modified": "30/05/2023 16:48"
    },
    {
      "id": 4,
      "name": "inventory",
      "created": "04/08/2016 00:00",
      "modified": "23/03/2021 09:14"
    },
    {
      "id": 11,
      "name": "invoices",
      "created": "08/10/2024 14:21",
      "modified": "08/10/2024 14:21"
    },
    {
      "id": 1,
      "name": "mobile",
      "created": "17/07/2016 17:09",
      "modified": "17/07/2016 17:09"
    },
    {
      "id": 12,
      "name": "newer",
      "created": "25/08/2026 08:37",
      "modified": "25/08/2026 08:37"
    },
    {
      "id": 2,
      "name": "orders",
      "created": "17/07/2016 17:09",
      "modified": "25/08/2026 08:36"
    },
    {
      "id": 5,
      "name": "quotations",
      "created": "29/09/2018 09:58",
      "modified": "24/06/2021 12:41"
    },
    {
      "id": 10,
      "name": "webshop",
      "created": "20/02/2024 16:46",
      "modified": "20/02/2024 16:46"
    }
  ]
}
