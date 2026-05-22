const whatsappService = require('./whatsapp.service');
const userWhatsappService = require('./user-whatsapp.service');

const parseRequestedUserId = (req) => {
  const rawUserId = req.query?.userId ?? req.body?.userId ?? null;
  if (rawUserId === null || rawUserId === undefined || rawUserId === '') {
    return null;
  }

  const userId = Number(rawUserId);
  if (!Number.isInteger(userId) || userId <= 0) {
    return null;
  }

  return userId;
};

const resolveSessionUserId = (req) => {
  const roles = req.user?.roles || [];
  if (roles.includes('Admin')) {
    const requestedUserId = parseRequestedUserId(req);
    if (requestedUserId) {
      return requestedUserId;
    }
  }

  if (req.user?.whatsappSessionUserId) {
    return req.user.whatsappSessionUserId;
  }

  if (!roles.includes('Admin') && req.user?.id) {
    return req.user.id;
  }

  return null;
};

const resolveWhatsappTarget = (req) => {
  const sessionUserId = resolveSessionUserId(req);
  if (sessionUserId) {
    return {
      isUserScoped: true,
      service: userWhatsappService,
      sessionUserId
    };
  }

  return {
    isUserScoped: false,
    service: whatsappService,
    sessionUserId: null
  };
};

module.exports = {
  parseRequestedUserId,
  resolveSessionUserId,
  resolveWhatsappTarget
};
