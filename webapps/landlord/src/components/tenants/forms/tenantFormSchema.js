import * as Yup from 'yup';

export const validationSchema = Yup.object().shape({
  name: Yup.string().required(),
  isCompany: Yup.string().required(),
  legalRepresentative: Yup.mixed().when('isCompany', {
    is: 'true',
    then: Yup.string().required()
  }),
  legalStructure: Yup.mixed().when('isCompany', {
    is: 'true',
    then: Yup.string().required()
  }),
  ein: Yup.mixed().when('isCompany', {
    is: 'true',
    then: Yup.string().required()
  }),
  dos: Yup.mixed().when('isCompany', {
    is: 'true',
    then: Yup.string()
  }),
  contacts: Yup.array().of(
    Yup.object().shape({
      contact: Yup.string().required(),
      email: Yup.string().email().required(),
      phone1: Yup.string(),
      phone2: Yup.string()
    })
  ),
  invoiceEmail: Yup.string().email().nullable(),
  address: Yup.object().shape({
    street1: Yup.string().required(),
    street2: Yup.string(),
    city: Yup.string().required(),
    zipCode: Yup.string().required(),
    state: Yup.string(),
    country: Yup.string().required()
  })
});

export const emptyContact = {
  contact: '',
  email: '',
  phone1: '',
  phone2: ''
};

export const initValues = (tenant) => {
  return {
    name: tenant?.name || '',
    isCompany: tenant?.isCompany ? 'true' : 'false',
    legalRepresentative: tenant?.manager || '',
    legalStructure: tenant?.legalForm || '',
    ein: tenant?.siret || '',
    dos: tenant?.rcs || '',
    capital: tenant?.capital || '',
    contacts: tenant?.contacts?.length
      ? tenant.contacts.map(({ contact, email, phone, phone1, phone2 }) => ({
          contact,
          email,
          phone1: phone1 || phone,
          phone2: phone2 || ''
        }))
      : [emptyContact],
    invoiceEmail: tenant?.invoiceEmail || '',
    address: {
      street1: tenant?.street1 || '',
      street2: tenant?.street2 || '',
      city: tenant?.city || '',
      zipCode: tenant?.zipCode || '',
      state: tenant?.state || '',
      country: tenant?.country || ''
    }
  };
};

export const validate = (tenant) => {
  return validationSchema.validate(initValues(tenant));
};
