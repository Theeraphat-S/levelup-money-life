import { createContext, useContext, useMemo } from "react";
import { useTranslation } from "react-i18next";
import {
  BUILT_IN_CATEGORIES,
  bucketForCategory,
  expenseCategoryIds,
  findCategory,
  type CategoryDef,
} from "../utils/categories";

// Defaults to the built-ins so components also render outside the provider (tests, previews)
export const CategoriesContext = createContext<CategoryDef[]>(BUILT_IN_CATEGORIES);

export function useCategories() {
  const list = useContext(CategoriesContext);
  const { t, i18n } = useTranslation();
  return useMemo(() => {
    const get = (id: string) => findCategory(list, id);
    const label = (id: string) => {
      const category = get(id);
      return category.builtIn ? t(`category.${id}`) : category.name ?? id;
    };
    return {
      list,
      get,
      label,
      color: (id: string) => get(id).color,
      bucket: (id: string) => bucketForCategory(list, id),
      expenseIds: (options?: Parameters<typeof expenseCategoryIds>[1]) => expenseCategoryIds(list, options),
    };
    // i18n.language re-labels built-ins when the language switches
  }, [list, t, i18n.language]);
}

export type CategoriesApi = ReturnType<typeof useCategories>;
