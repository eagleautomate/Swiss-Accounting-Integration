/*! *****************************************************************************
Licensed under the GPL, Version 3.0 (the "License"); you may not use
this file except in compliance with the License. You may obtain a copy of the
License at https://www.gnu.org/licenses/gpl-3.0.en.html

THIS CODE IS PROVIDED ON AN *AS IS* BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
KIND, EITHER EXPRESS OR IMPLIED, INCLUDING WITHOUT LIMITATION ANY IMPLIED
WARRANTIES OR CONDITIONS OF TITLE, FITNESS FOR A PARTICULAR PURPOSE,
MERCHANTABLITY OR NON-INFRINGEMENT.

***************************************************************************** */

/**
 * Parses address line to extract street name and house number
 * According to Swiss QR Bill Type "S" specification
 * @param {String} addressLine Full address line (e.g., "Musterstrasse 28" or "28 Musterstrasse")
 * @returns {Object} { street: string, houseNumber: string }
 */
const parseAddressLine = (addressLine) => {
  if (!addressLine || addressLine.trim() === "") {
    return { street: "", houseNumber: "" };
  }

  const trimmedAddress = addressLine.trim();

  // Pattern 1: Number at the end (e.g., "Musterstrasse 28", "Grosse Marktgasse 28")
  const patternNumberAtEnd = /^(.+?)\s+(\d+[a-zA-Z]?)$/;
  const matchEnd = trimmedAddress.match(patternNumberAtEnd);

  if (matchEnd) {
    return {
      street: matchEnd[1].trim(),
      houseNumber: matchEnd[2].trim()
    };
  }

  // Pattern 2: Number at the beginning (e.g., "28 Musterstrasse")
  const patternNumberAtStart = /^(\d+[a-zA-Z]?)\s+(.+)$/;
  const matchStart = trimmedAddress.match(patternNumberAtStart);

  if (matchStart) {
    return {
      street: matchStart[2].trim(),
      houseNumber: matchStart[1].trim()
    };
  }

  // No number found - return entire address as street
  return {
    street: trimmedAddress,
    houseNumber: ""
  };
};

/**
 * Creates Address Configuration
 * @param {String} currency CHF | EUR
 * @param {*} amount Amount To Pay
 * @param {String} reference Reference Code
 * @param {String} company Company Name
 * @param {Object} companyAddress Company Address
 * @param {String} companyAddressCode ALPHA-2 Address Code
 * @param {String} iban QR-IBAN
 * @param {String} customer Customer Name, max 70 Chars, rest will be removed
 * @param {Object} customerAddress Customer Address, max 70 Chars, rest will be removed
 * @param {String} customerAddressCode Customer Address Code
 * @returns Address Configuration
 */
export const generateQRConfig = (
  currency,
  amount,
  company,
  companyAddress,
  companyAddressCode,
  iban,
  customer,
  customerAddress,
  customerAddressCode,
  reference
) => {
  // Parse company address to extract street and house number for Type "S" structured address
  const companyParsed = parseAddressLine(companyAddress.address_line1);
  const companyStreet = companyParsed.street.substring(0, 70);
  // Use parsed house number, or fallback to address_line2 if available
  const companyHouseNumber = companyParsed.houseNumber ||
    (companyAddress.address_line2 ? companyAddress.address_line2.substring(0, 16) : "");

  // Parse customer address to extract street and house number for Type "S" structured address
  const customerParsed = parseAddressLine(customerAddress.address_line1);
  const customerStreet = customerParsed.street.substring(0, 70);
  // Use parsed house number, or fallback to address_line2 if available
  const customerHouseNumber = customerParsed.houseNumber ||
    (customerAddress.address_line2 ? customerAddress.address_line2.substring(0, 16) : "");

  return {
    currency,
    amount,
    reference,
    creditor: {
      name: company,
      address: companyStreet, // Street name only (Type "S" structured)
      houseNumber: companyHouseNumber, // House number only (Type "S" structured)
      zip: parseInt(companyAddress.pincode), // Bank Account Code
      city: companyAddress.city, // Bank Account City
      account: iban, // Bank Account Iban
      country: companyAddressCode, // Bank Country
    },
    debtor: {
      name: customer.substring(0, 70), // Customer Doctype
      address: customerStreet, // Street name only (Type "S" structured)
      houseNumber: customerHouseNumber, // House number only (Type "S" structured)
      zip: customerAddress.pincode, // Sales Invoice PCode
      city: customerAddress.city, // Sales Invoice City
      country: customerAddressCode, // Sales Invoice Country
    },
  };
};