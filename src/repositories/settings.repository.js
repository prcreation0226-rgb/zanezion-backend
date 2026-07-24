import prisma from '../config/db.js';

export const getSettings = async () => {
  return await prisma.setting.findMany();
};

export const getSettingByKey = async (key) => {
  return await prisma.setting.findUnique({ where: { key } });
};

export const updateSetting = async (key, value) => {
  return await prisma.setting.upsert({
    where: { key },
    update: { value },
    create: { key, value, group: 'GENERAL' }
  });
};
