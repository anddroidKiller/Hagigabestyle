import { useTranslation } from 'react-i18next';

export function useLocalized() {
  const { i18n } = useTranslation();
  const isHebrew = i18n.language === 'he';

  const getName = (item: { nameHe: string; nameEn: string }) =>
    isHebrew ? item.nameHe : item.nameEn;

  const getDescription = (item: { descriptionHe?: string; descriptionEn?: string }) =>
    isHebrew ? item.descriptionHe : item.descriptionEn;

  const getCategoryName = (item: { categoryNameHe: string; categoryNameEn: string }) =>
    isHebrew ? item.categoryNameHe : item.categoryNameEn;

  const getProductName = (item: { productNameHe: string; productNameEn: string }) =>
    isHebrew ? item.productNameHe : item.productNameEn;

  return { isHebrew, getName, getDescription, getCategoryName, getProductName };
}
