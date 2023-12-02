import { baseCompile } from './compile'

export {baseCompile} from './compile'

export function compile(template:string, options){
    return baseCompile(template, options)
}