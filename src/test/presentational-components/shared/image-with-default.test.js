import React from 'react';
import { mount } from 'enzyme';
import toJson from 'enzyme-to-json';
import ImageWithDefault from '../../../presentational-components/shared/image-with-default';

describe('<ImageWithDefault />', () => {
  let initialProps;
  beforeEach(() => {
    initialProps = {
      src: 'foo'
    };
  });

  it('should render correctly', () => {
    const wrapper = mount(<ImageWithDefault {...initialProps} />);
    expect(toJson(wrapper)).toMatchSnapshot();
  });
});
