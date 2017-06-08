import React, { Component, PropTypes } from 'react';
import {
  View,
  StyleSheet,
  PanResponder
} from 'react-native';

export default class PinchZoomView extends Component {

  static propTypes = {
    ...View.propTypes,
    scalable: PropTypes.bool,
    onMove: PropTypes.func,
    minActiveTouchesZoom: PropTypes.number,
    maxActiveTouchesZoom: PropTypes.number,
    minActiveTouchesTranslate: PropTypes.number,
    maxActiveTouchesTranslate: PropTypes.number,
  };

  static defaultProps = {
    scalable: true,
    onMove: () => {},
    minActiveTouchesZoom: 2,
    maxActiveTouchesZoom: 2,
    minActiveTouchesTranslate: 1,
    maxActiveTouchesTranslate: 1,
  };

  constructor(props) {
    super(props);
    this.state = {
      scale: 1,
      lastScale: 1,
      offsetX: 0,
      offsetY: 0,
      lastX: 0,
      lastY: 0
    },
    this.distant = 150;
  }

  componentWillMount() {
    this.gestureHandlers = PanResponder.create({
      onStartShouldSetPanResponder: this._handleStartShouldSetPanResponder,
      onMoveShouldSetPanResponder: this._handleMoveShouldSetPanResponder,
      onPanResponderGrant: this._handlePanResponderGrant,
      onPanResponderMove: this._handlePanResponderMove,
      onPanResponderRelease: this._handlePanResponderEnd,
      onPanResponderTerminationRequest: evt => true,
      onShouldBlockNativeResponder: evt => false
    });
  }

  _handleStartShouldSetPanResponder = (e, gestureState) => {
    // don't respond to single touch to avoid shielding click on child components
    return false;
  }

  _handleMoveShouldSetPanResponder = (e, gestureState) => {
    return this.props.scalable && gestureState.dx > 2 || gestureState.dy > 2 || gestureState.numberActiveTouches === 2;
  }

  _handlePanResponderGrant = (e, gestureState) => {
    if (gestureState.numberActiveTouches >= this.props.minActiveTouchesZoom && gestureState.numberActiveTouches <= this.props.maxActiveTouchesZoom) {
      let dx = Math.abs(e.nativeEvent.touches[0].pageX - e.nativeEvent.touches[1].pageX);
      let dy = Math.abs(e.nativeEvent.touches[0].pageY - e.nativeEvent.touches[1].pageY);
      let distant = Math.sqrt(dx * dx + dy * dy);
      this.distant = distant;
    }
  }

  _handlePanResponderEnd = (e, gestureState) => {
    this.setState({
      lastX: this.state.offsetX,
      lastY: this.state.offsetY,
      lastScale: this.state.scale
    });
  }

  _handlePanResponderMove = (e, gestureState) => {
    let updates = {};
    // zoom
    if (gestureState.numberActiveTouches >= this.props.minActiveTouchesZoom && gestureState.numberActiveTouches <= this.props.maxActiveTouchesZoom) {
      let dx = Math.abs(e.nativeEvent.touches[0].pageX - e.nativeEvent.touches[1].pageX);
      let dy = Math.abs(e.nativeEvent.touches[0].pageY - e.nativeEvent.touches[1].pageY);
      let distant = Math.sqrt(dx * dx + dy * dy);
      let scale = distant / this.distant * this.state.lastScale;
      updates = Object.assign(updates, {}, {scale});
    }
    // translate
    if (gestureState.numberActiveTouches >= this.props.maxActiveTouchesTranslate && gestureState.numberActiveTouches <= this.props.maxActiveTouchesTranslate) {
      let offsetX = this.state.lastX + gestureState.dx / this.state.scale;
      let offsetY = this.state.lastY + gestureState.dy / this.state.scale;
      updates = Object.assign(updates, {}, {offsetX, offsetY});
    }

    if(Object.keys(updates).length) {
      this.setState(updates);
      this.props.onMove(updates);
    }
  }

  render() {
    return (
        <View
          {...this.gestureHandlers.panHandlers}
          style={[styles.container, this.props.style, {
            transform: [
              {scaleX: this.state.scale},
              {scaleY: this.state.scale},
              {translateX: this.state.offsetX},
              {translateY: this.state.offsetY}
            ]
          }]}>
          {this.props.children}
        </View>
    );
  }
}

const styles = StyleSheet.create({
 container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  }
});
