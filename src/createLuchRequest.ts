import { LuchRequest } from './core/LuchRequest'
import type { RequestDefaults } from './types'

/** 公共请求实例类型；具体实现类暂不作为入口导出。 */
export type LuchRequestInstance<
  TNativeOptions extends object = {}
> = LuchRequest<TNativeOptions>

/**
 * 创建相互独立的请求实例。
 * 工厂作为稳定的公共边界，内部实现可在不改变调用方式的前提下演进。
 */
export function createLuchRequest<TNativeOptions extends object = {}>(
  defaults: RequestDefaults<TNativeOptions> = {}
): LuchRequestInstance<TNativeOptions> {
  return new LuchRequest(defaults)
}
