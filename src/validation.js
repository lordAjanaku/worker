import validator from "https://esm.sh/validator";

// prettier-ignore
const emails = [
  "sumeet_sethi@uhc.com",
  " jeviadelpuerto@marathonpetroleum.com",
  " kbouwman@apple.com",
  " aboyle@costco.com",
  " laura.snape@metlife.com",
  " darshini.perera@boeing.com",
  " claudia.neufeld@disney.com",
  " paolomodolo@microsoft.com",
  " johndeere@deere.com",
  // ==========================
  "sumeet_sethi@uhc.com",
  " jeviadelpuerto@marathonpetroleum.com",
  " kbouwman@apple.com",
  " aboyle@costco.com",
  // ==========================
  "sumeet_sethi@uhc.com",
  " jeviadelpuerto@marathonpetroleum.com",
  " kbouwman@apple.com",
  " paolomodolo@microsoft.com",
  " johndeere@deere.com",
  "roger.support@rci.com" 
  // ==========================
];

class Validation {
  constructor(...emails) {
    this.emails = [];
    this.isEmailsValidated = false;
    this.totalEmails;
    this.validEmails = [];
    this.invalidEmails = [];
    this.roleBasedEmails = [];
    this.nonRoleBasedEmails = [];
    this.roleBase;
    this.nonRoleBase;
    this.emailProviders;

    this._setValues(emails);
  }

  _setValues(emails) {
    // this code flatten "emails" if it is a nested array
    const newEmails = Array.isArray(emails) && emails.length === 1 ? emails.flat(1) : emails;

    const removeDuplicate = new Set(newEmails);

    this.emails = [...removeDuplicate].map((email) => email.trim().toLowerCase());

    // set the this.isEmailsValidated to "true"
    this.isEmailsValidated = true;

    // validate emails
    this._validateEmails(this.emails);

    this._setTotalEmails(this.emails);

    this._setEmailProviders(this.emails);

    this._setRolebase(this.validEmails);

    return;
  }

  _validateEmails(emails) {
    if (!this.isEmailsValidated) return;

    const trimmedEmails = emails.map((email) => email.trim());

    this._setValidEmails(trimmedEmails);
    this._setInvalidEmails(trimmedEmails);
  }

  _createEmailObject(email) {
    return {
      email: email,
      isRoleBase: this._checkRoleBased(email),
    };
  }

  _setValidEmails(emails) {
    const filteredEmails = emails.filter((email) => validator.isEmail(email));

    const newEmails = filteredEmails.map((email) => this._createEmailObject(email));

    this.validEmails = filteredEmails.length >= 1 ? newEmails : [];
  }

  _setInvalidEmails(emails) {
    const filteredEmails = emails.filter((email) => !validator.isEmail(email));

    const newEmails = filteredEmails.map((email) => this._createEmailObject(email));

    this.invalidEmails = filteredEmails.length >= 1 ? newEmails : [];
  }

  _setTotalEmails(emails) {
    this.totalEmails = emails.length;
  }

  _setEmailProviders(emails) {
    const domains = emails.reduce((domain, email) => {
      const extension = email.split("@")[1];
      domain[extension] = (domain[extension] || 0) + 1;
      return domain;
    }, {});

    this.emailProviders = domains;
  }

  _setRolebase(emails) {
    if (!emails || emails.length === 0) {
      this.roleBasedEmails = [];
      this.nonRoleBasedEmails = [];
      this.roleBase = 0;
      this.nonRoleBase = 0;
      return;
    }

    const roleBased = emails.filter((emailObj) => emailObj.isRoleBase);
    const nonRoleBased = emails.filter((emailObj) => !emailObj.isRoleBase);

    this.roleBasedEmails = roleBased;
    this.nonRoleBasedEmails = nonRoleBased;

    this.roleBase = roleBased.length;
    this.nonRoleBase = nonRoleBased.length;
  }

  _checkRoleBased(email) {
    const roleBasedRegex =
      /(?:^|[\.\-_])(admin|administrator|support|help|info|sales|contact|billing|account(?:s)?|noreply|no-reply|hr|humanresources|customerservice|service|webmaster|team|office|inquir(?:y|ies)|press|marketing|jobs?|career|feedback|newsletter|security|postmaster|abuse)(?:[\.\-_]|\d+)?@/i;
    const isRoleBase = roleBasedRegex.test(email);

    return isRoleBase;
  }

  getTotalEmails() {
    return this.totalEmails;
  }

  getValidEmail() {
    return this.validEmails;
  }

  getInvalidEmail() {
    return this.invalidEmails;
  }

  getEmailProviders() {
    return this.emailProviders;
  }

  getRoleBasedEmails() {
    return this.roleBasedEmails;
  }

  getNonRoleBasedEmails() {
    return this.nonRoleBasedEmails;
  }

  getRoleBaseCount() {
    return this.roleBase;
  }

  getNonRoleBaseCount() {
    return this.nonRoleBase;
  }
}

const validation = new Validation(emails);

console.dir(validation);
