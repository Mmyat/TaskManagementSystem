import {roles } from "./schema";

type EnumValueArray = readonly string[];

export function createEnumHelper<const T extends EnumValueArray>(values: T) {
  type EnumType = T[number];

  const validValues = values;

  function parseEnum(input: string, defaultValue?: EnumType): EnumType | null {
    if (validValues.includes(input as EnumType)) {
      return input as EnumType;
    }
    if (defaultValue && validValues.includes(defaultValue)) {
      return defaultValue;
    }
    return null;
  }

  return {
    values: validValues,
    parse: parseEnum,
  };
}

const roleHelper = createEnumHelper(roles.enumValues);
export const validRoles = roleHelper.values;
export type Role = typeof validRoles[number];
export const parseRole = roleHelper.parse;