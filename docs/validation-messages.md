# Validation copy: ours vs. `@valibot/i18n/nl`

27 validation msgids in src/features (76 before the rule templates in `ruleMessage` replaced the per-field copy), read off the source and grouped by the valibot rule that raises them. `%(field)s` is the field's label, `%(n)s` the rule's number. The `a`/`an` pair under the first two headings is `requiredMessage`/`selectMessage` choosing the article from the label's opening sound, so a language whose article does not depend on it translates both to one line.
The **official** line is the real output of `v.safeParse` with the nl locale loaded, on the sample input named in the heading.


## required text — `minLength(1)` on `""`

**Official nl:** `Ongeldige lengte: >=1 verwacht, maar 0 ontvangen`

| Ours (en) | Ours (nl, from django.po) | Used for |
|---|---|---|
| Please enter a %(field)s | ⚠️ untranslated | 1× in src |
| Please enter an %(field)s | ⚠️ untranslated | 1× in src |
| Please tell us something about yourself | Vertel iets over jezelf | 1× in src |

## required picker — `number()` given `null`

**Official nl:** `Ongeldig type: number verwacht, maar null ontvangen`

| Ours (en) | Ours (nl, from django.po) | Used for |
|---|---|---|
| Please select a %(field)s | ⚠️ untranslated | 1× in src |
| Please select an %(field)s | ⚠️ untranslated | 1× in src |

## `maxLength(255)` on 256 chars

**Official nl:** `Ongeldige lengte: <=255 verwacht, maar 256 ontvangen`

| Ours (en) | Ours (nl, from django.po) | Used for |
|---|---|---|
| Please use at most %(n)s characters | ⚠️ untranslated | 1× in src |

## `minLength(2)` on 1 char

**Official nl:** `Ongeldige lengte: >=2 verwacht, maar 1 ontvangen`

| Ours (en) | Ours (nl, from django.po) | Used for |
|---|---|---|
| Please use at least %(n)s characters | ⚠️ untranslated | 1× in src |

## `email()` on `"foo"`

**Official nl:** `Ongeldige e-mail: "foo" ontvangen`

| Ours (en) | Ours (nl, from django.po) | Used for |
|---|---|---|
| Please enter a valid email | Vul een valide email in | 1× in src |
| You must provide at least 1 valid email recipient | ⚠️ untranslated | 1× in src |

## `url()` on `"foo"`

**Official nl:** `Ongeldige URL: "foo" ontvangen`

| Ours (en) | Ours (nl, from django.po) | Used for |
|---|---|---|
| Please enter a website | Vul een website in | 1× in src |

## `regex(/^\d+$/)` on `"abc"`

**Official nl:** `Ongeldig formaat: /^\d+$/ verwacht, maar "abc" ontvangen`

| Ours (en) | Ours (nl, from django.po) | Used for |
|---|---|---|
| Please enter a date | Vul een datum in | 1× in src |
| Please enter a valid %(field)s | ⚠️ untranslated | 1× in src |
| Please enter a valid end time HH:mm | Vul een geldige eind-tijd in | 1× in src |
| Please enter a valid start time HH:mm | Vul een geldige start-tijd in HH:mm | 1× in src |
| Please enter an amount, like 12.50 | ⚠️ untranslated | 1× in src |
| Please provide a valid phone number | ⚠️ untranslated | 2× in src |
| Please use only letters, digits and @ . + - _ | ⚠️ untranslated | 1× in src |
| Please use yyyy-mm-dd for the date of birth | ⚠️ untranslated | 1× in src |

## `integer()` on `1.5`

**Official nl:** `Ongeldig geheel getal: 1.5 ontvangen`

| Ours (en) | Ours (nl, from django.po) | Used for |
|---|---|---|
| Please enter a whole number | ⚠️ untranslated | 2× in src |

## `number()` on `NaN` (typed text in a number field)

**Official nl:** `Ongeldig type: number verwacht, maar NaN ontvangen`

| Ours (en) | Ours (nl, from django.po) | Used for |
|---|---|---|
| Please enter a number | Vul een nummer in | 1× in src |

## `minValue(1)` on `0`

**Official nl:** `Ongeldige waarde: >=1 verwacht, maar 0 ontvangen`

| Ours (en) | Ours (nl, from django.po) | Used for |
|---|---|---|
| Please enter a value of at least %(n)s | ⚠️ untranslated | 1× in src |
| Please enter a value of at most %(n)s | ⚠️ untranslated | 1× in src |
| Please enter a whole number of people, at least 1 | ⚠️ untranslated | 1× in src |

## `check()` failing

**Official nl:** `Ongeldige invoer: "x" ontvangen`

| Ours (en) | Ours (nl, from django.po) | Used for |
|---|---|---|
| Passwords do not match | Wachtwoorden komen niet overeen | 1× in src |
| You must provide at least 1 email recipient | Voer minstens 1 ontvanger in | 1× in src |

## server-side uniqueness (not a valibot rule)

**Official nl:** `— (no valibot equivalent)`

| Ours (en) | Ours (nl, from django.po) | Used for |
|---|---|---|
| Company code is already in use | Bedrijfscode is al in gebruik | 1× in src |
| Username is already in use | Gebruikersnaam is al in gebruik | 1× in src |

## Not in the Dutch catalogue

- Please enter a %(field)s
- Please enter an %(field)s
- Please select a %(field)s
- Please select an %(field)s
- Please use at most %(n)s characters
- Please use at least %(n)s characters
- You must provide at least 1 valid email recipient
- Please enter a valid %(field)s
- Please enter an amount, like 12.50
- Please provide a valid phone number
- Please use only letters, digits and @ . + - _
- Please use yyyy-mm-dd for the date of birth
- Please enter a whole number
- Please enter a value of at least %(n)s
- Please enter a value of at most %(n)s
- Please enter a whole number of people, at least 1
