'use client'

import { useQuery, useQueryClient } from '@tanstack/react-query'
import {
  getDebtors,
  getExpenses,
  getHeldSales,
  getMultiItemSales,
  getProducts,
  getSales,
  type Debtor,
  type Expense,
  type Product,
  type Sale
} from '@/lib/firestore'
import type { HeldSale, MultiItemSale } from '@/lib/multi-item-sales-types'

export const businessQueryKeys = {
  all: ['business'] as const,
  products: (userId?: string, branchId?: string) => [...businessQueryKeys.all, 'products', userId || '', branchId || ''] as const,
  sales: (userId?: string, branchId?: string, max = 2000) => [...businessQueryKeys.all, 'sales', userId || '', branchId || '', max] as const,
  multiItemSales: (userId?: string, branchId?: string, max = 2000) => [...businessQueryKeys.all, 'multi-item-sales', userId || '', branchId || '', max] as const,
  heldSales: (userId?: string, branchId?: string, max = 50) => [...businessQueryKeys.all, 'held-sales', userId || '', branchId || '', max] as const,
  expenses: (userId?: string, branchId?: string, max = 500) => [...businessQueryKeys.all, 'expenses', userId || '', branchId || '', max] as const,
  debtors: (userId?: string, branchId?: string) => [...businessQueryKeys.all, 'debtors', userId || '', branchId || ''] as const,
  dashboard: (userId?: string, branchId?: string) => [...businessQueryKeys.all, 'dashboard', userId || '', branchId || ''] as const,
  pos: (userId?: string, branchId?: string) => [...businessQueryKeys.all, 'pos', userId || '', branchId || ''] as const
}

interface BusinessQueryArgs {
  userId?: string
  branchId?: string
}

export function useProductsQuery({ userId, branchId }: BusinessQueryArgs) {
  return useQuery<Product[]>({
    queryKey: businessQueryKeys.products(userId, branchId),
    queryFn: () => getProducts(userId!, branchId),
    enabled: Boolean(userId),
    staleTime: 2 * 60 * 1000,
    placeholderData: previous => previous
  })
}

export function useSalesQuery({ userId, branchId, max = 2000 }: BusinessQueryArgs & { max?: number }) {
  return useQuery<Sale[]>({
    queryKey: businessQueryKeys.sales(userId, branchId, max),
    queryFn: () => getSales(userId!, max),
    enabled: Boolean(userId),
    staleTime: 45 * 1000,
    placeholderData: previous => previous
  })
}

export function useMultiItemSalesQuery({ userId, branchId, max = 2000 }: BusinessQueryArgs & { max?: number }) {
  return useQuery<MultiItemSale[]>({
    queryKey: businessQueryKeys.multiItemSales(userId, branchId, max),
    queryFn: () => getMultiItemSales(userId!, max),
    enabled: Boolean(userId),
    staleTime: 45 * 1000,
    placeholderData: previous => previous
  })
}

export function useHeldSalesQuery({ userId, branchId, max = 50 }: BusinessQueryArgs & { max?: number }) {
  return useQuery<HeldSale[]>({
    queryKey: businessQueryKeys.heldSales(userId, branchId, max),
    queryFn: () => getHeldSales(userId!, max),
    enabled: Boolean(userId),
    staleTime: 30 * 1000,
    placeholderData: previous => previous
  })
}

export function useExpensesQuery({ userId, branchId, max = 500 }: BusinessQueryArgs & { max?: number }) {
  return useQuery<Expense[]>({
    queryKey: businessQueryKeys.expenses(userId, branchId, max),
    queryFn: () => getExpenses(userId!, max),
    enabled: Boolean(userId),
    staleTime: 60 * 1000,
    placeholderData: previous => previous
  })
}

export function useDebtorsQuery({ userId, branchId }: BusinessQueryArgs) {
  return useQuery<Debtor[]>({
    queryKey: businessQueryKeys.debtors(userId, branchId),
    queryFn: () => getDebtors(userId!),
    enabled: Boolean(userId),
    staleTime: 2 * 60 * 1000,
    placeholderData: previous => previous
  })
}

export function useDashboardDataQuery({ userId, branchId }: BusinessQueryArgs) {
  return useQuery({
    queryKey: businessQueryKeys.dashboard(userId, branchId),
    queryFn: async () => {
      const [products, sales, multiItemSales, expenses, debtors] = await Promise.all([
        getProducts(userId!, branchId),
        getSales(userId!, 2000),
        getMultiItemSales(userId!, 2000),
        getExpenses(userId!, 500),
        getDebtors(userId!)
      ])

      return { products, sales, multiItemSales, expenses, debtors }
    },
    enabled: Boolean(userId),
    staleTime: 45 * 1000,
    placeholderData: previous => previous
  })
}

export function usePOSDataQuery({ userId, branchId }: BusinessQueryArgs) {
  return useQuery({
    queryKey: businessQueryKeys.pos(userId, branchId),
    queryFn: async () => {
      const [products, singleSales, multiItemSales, heldSales] = await Promise.all([
        getProducts(userId!, branchId),
        getSales(userId!, 2000),
        getMultiItemSales(userId!, 2000),
        getHeldSales(userId!, 50).catch((error) => {
          console.warn('Unable to load held sales:', error)
          return [] as HeldSale[]
        })
      ])

      return { products, singleSales, multiItemSales, heldSales }
    },
    enabled: Boolean(userId),
    staleTime: 30 * 1000,
    placeholderData: previous => previous
  })
}

export function useInvalidateBusinessData() {
  const queryClient = useQueryClient()

  return {
    invalidateAllBusinessData: () => queryClient.invalidateQueries({ queryKey: businessQueryKeys.all }),
    invalidateProducts: () => queryClient.invalidateQueries({ queryKey: [...businessQueryKeys.all, 'products'] }),
    invalidateSales: () => Promise.all([
      queryClient.invalidateQueries({ queryKey: [...businessQueryKeys.all, 'sales'] }),
      queryClient.invalidateQueries({ queryKey: [...businessQueryKeys.all, 'multi-item-sales'] }),
      queryClient.invalidateQueries({ queryKey: [...businessQueryKeys.all, 'held-sales'] }),
      queryClient.invalidateQueries({ queryKey: [...businessQueryKeys.all, 'pos'] }),
      queryClient.invalidateQueries({ queryKey: [...businessQueryKeys.all, 'dashboard'] })
    ]),
    invalidateDashboard: () => queryClient.invalidateQueries({ queryKey: [...businessQueryKeys.all, 'dashboard'] })
  }
}
