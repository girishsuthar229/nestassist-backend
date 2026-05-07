import { RecentSearch } from "@/models";
import { Transaction } from "sequelize";

/**
 * @name findRecentSearchesByUserId
 * @description Get recent searches for a user
 */
export const findRecentSearchesByUserId = async (userId: number, limit = 10) => {
  return await RecentSearch.findAll({
    where: { userId },
    order: [["createdAt", "DESC"]],
    limit,
  });
};

/**
 * @name createRecentSearch
 * @description Save a new recent search
 */
export const createRecentSearch = async (data: any, transaction?: Transaction) => {
  return await RecentSearch.create(data, { transaction });
};

/**
 * @name deleteOldSearches
 * @description Optional: Keep only the latest N searches
 */
export const deleteOldSearches = async (userId: number, keepCount = 10) => {
  const searches = await RecentSearch.findAll({
    where: { userId },
    order: [["createdAt", "DESC"]],
    offset: keepCount,
  });

  if (searches.length > 0) {
    const ids = searches.map((s) => s.id);
    await RecentSearch.destroy({ where: { id: ids } });
  }
};
