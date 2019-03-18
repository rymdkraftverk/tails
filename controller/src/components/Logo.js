import React from 'react'
import PropTypes from 'prop-types'
import styled from 'styled-components/macro'
import LogoImg from '../images/logo.png'

const Container = styled.div`
  display: flex;
  margin-top: 32px;
  z-index: 1;
`

const Img = styled.img`
  height: 15vw;
  width: auto;
`

const Title = styled.p`
  color: white;
  font-size: 4vw;
  margin-top: 3vw;
`

const Logo = ({ className }) => {
  return (
    <Container className={className}>
      <Img src={LogoImg} alt="Logo" />
      <Title>tails</Title>
    </Container>
  )
}

Logo.propTypes = {
  className: PropTypes.string,
}

Logo.defaultProps = {
  className: '',
}

export default Logo
