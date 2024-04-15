import {
  TipTapRender,
  NodeHandlers,
  NodeHandler,
  TipTapNode,
} from '@troop.com/tiptap-react-render';

const doc: NodeHandler = (props) => (<>{props.children}</>)
const text: NodeHandler = (props) => {
  // you could process text marks here from props.node.marks ...
  return <span>{props.node.text}</span>
}

const paragraph: NodeHandler = (props) => {
  return <p>{props.children}</p>
}


const handlers: NodeHandlers = {
  "doc": doc,
  "text": text,
  "paragraph": paragraph,
}



export default function RenderToJson({data}: {data: any}) {
  return (
    <div className='px-2 mb-1 prose'>
    <TipTapRender handlers={handlers} node={data}  />
    
    </div>
  )
}
