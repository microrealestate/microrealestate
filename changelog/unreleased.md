This version makes the landlord app easier to use, also on a phone. You can now organize your properties as they really are: buildings, floors and units.

Before you update, make a backup of your data: the database and the `data/uploads` folder. The update changes how the app keeps some property information. If a problem occurs, the backup lets you go back. The steps are in [OPERATIONS.md](https://github.com/microrealestate/microrealestate/blob/main/documentation/OPERATIONS.md).

### New

#### Properties

- Organize your properties as they really are: an estate with buildings, a building with floors and units, a unit with rooms or a cellar. See all the units of a site on one page. (#10)
- Write notes and add your own information to each property, for example the insurance or the door code. You can show this information in your contracts. (#254)
- The phone number and the door code that you already entered are now on the new Details tab of the property.
- Buildings and floors that only group units do not count as rental units.

#### Phones

- The landlord app and the tenant app are easier to use on a phone.
- You can install the apps on your phone or your computer, as any other progressive web application (PWA).

#### Rents

- Click a rent to see all its information and do all its actions in one place.
- See which document you sent last to a tenant, and when.
- The app tells you which reminder to send next.

#### Contracts and leases

- When the app cannot let you delete a contract or a tenant, it tells you why.
- Deposit refunds are always visible in the lease.

#### Look and feel

- A cleaner layout, easier to read in the light and the dark theme.
- The tenant app shows the name of the tenant.

#### Updates

- The landlord app tells you when a new version is available and shows what changed.
- The About window (user menu > About) shows your version.

### Fixes

- When you created a company organization, the app did not save the company details. If you are a company, open Settings > Landlord and save it one time.
- The main menu now shows the company name of a company landlord.
- The Back button now takes you back to the correct page.
- A property sometimes showed the information of the previous property.
- Some form errors did not show the correct message.
- On the rental activity page, a long payment reference covered the amount.
- The todo page showed for a short time before the dashboard.

### Other

- This version updates some software components. We recommend that you install it.
