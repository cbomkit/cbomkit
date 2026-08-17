declare module '@carbon/icons/es/*' {
  interface CarbonIconAttrs {
    [key: string]: string | number
  }

  interface CarbonIconContent {
    elem: string
    attrs: CarbonIconAttrs
  }

  interface CarbonIconDescriptor {
    elem: string
    attrs: CarbonIconAttrs
    content: CarbonIconContent[]
    name: string
    size: number
  }

  const descriptor: CarbonIconDescriptor
  export default descriptor
}
