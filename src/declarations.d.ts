import * as React from 'react';

declare module 'disqus-react' {
  export interface DiscussionEmbedProps {
    shortname: string;
    config: {
      url: string;
      identifier: string;
      title: string;
      language?: string;
      category_id?: string;
    };
  }
  export class DiscussionEmbed extends React.Component<DiscussionEmbedProps> {}
}
