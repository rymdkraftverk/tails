import styled from 'styled-components'
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

function Logo({ className }: { className?: string }) {
  return (
    <Container className={className}>
      <Img src={LogoImg} alt="Logo" />
      <Title>tails</Title>
    </Container>
  )
}

export default Logo
