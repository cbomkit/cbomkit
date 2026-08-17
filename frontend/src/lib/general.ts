import type { CbomComponent } from '@/types/cbom'
import type { CodeOrigin } from '@/types/scan'

export { getTitle, isViewerOnly } from '@/config'

export function capitalizeFirstLetter(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1)
}

export function numberFormatter(num: number): string | number {
  if (Math.abs(num) > 999) {
    if (Math.abs(num) > 999999) {
      return Math.sign(num) * Number((Math.abs(num) / 1_000_000).toFixed(1)) + 'M'
    }
    return Math.sign(num) * Number((Math.abs(num) / 1000).toFixed(1)) + 'K'
  }
  return Math.sign(num) * Math.abs(num)
}

export function formatSeconds(seconds: number): string {
  if (seconds < 0) return 'Invalid input'
  const minutes = Math.floor(seconds / 60)
  if (minutes > 0) return `${minutes}m ${seconds % 60}s`
  if (seconds === 0) return '1s'
  return `${seconds}s`
}

export function openGitRepo(gitUrl: string) {
  window.open(gitUrl, '_blank', 'noreferrer')
}

export function canOpenOnline(codeOrigin: CodeOrigin): boolean {
  if (!codeOrigin.gitUrl) return false
  if (!codeOrigin.revision && !codeOrigin.commitID) return false
  return true
}

export function getCodeLink(
  component: CbomComponent,
  codeOrigin: CodeOrigin,
  numberOfLinesBeforeAfter = 0,
): string | undefined {
  if (!canOpenOnline(codeOrigin)) return undefined
  const occurrences = component.evidence?.occurrences ?? []
  if (occurrences.length !== 1) return undefined

  const { gitUrl, revision, commitID } = codeOrigin
  const first = occurrences[0]
  const filePath = first.location
  const lineNumber = first.line ?? 1
  const versionIdentifier = commitID ?? revision
  const startLine = Math.max(1, lineNumber - numberOfLinesBeforeAfter)
  const endLine = lineNumber + numberOfLinesBeforeAfter

  if (!gitUrl) return undefined

  if (gitUrl.includes('github.com') || gitUrl.includes('gitlab.com')) {
    return `${gitUrl}/blob/${versionIdentifier}/${filePath}#L${startLine}-L${endLine}`
  }
  if (gitUrl.includes('bitbucket.org')) {
    return `${gitUrl}/src/${versionIdentifier}/${filePath}#lines-${startLine}:${endLine}`
  }
  return undefined
}

export function openOnline(component: CbomComponent, codeOrigin: CodeOrigin) {
  const codeUrl = getCodeLink(component, codeOrigin)
  if (codeUrl) window.open(codeUrl, '_blank', 'noreferrer')
}

export function limitString(value: string, limit: number): string {
  if (value.length <= limit) return value
  return value.slice(0, limit) + '...'
}
